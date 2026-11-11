import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { AuctionModel } from '../auctions/auctions.model.js'
import { OrderModel } from '../orders/orders.model.js'
import type { ProducerEmbedded, UserRole } from '../users/users.model.js'
import { UserModel } from '../users/users.model.js'

let server: Server
let baseUrl = ''
let counter = 0

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  await Promise.all([UserModel.syncIndexes(), OrderModel.syncIndexes(), AuctionModel.syncIndexes()])
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const address = server.address()
  if (!address || typeof address !== 'object') throw new Error('no port')
  baseUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  await disconnect()
})

async function createUser(role: UserRole, producer?: Partial<ProducerEmbedded>) {
  counter += 1
  const doc = await UserModel.create({
    name: `User ${counter}`,
    email: `be20l.${counter}@example.com`,
    passwordHash: 'x',
    role,
    ...(producer ? { producer: { farmName: `Farm ${counter}`, status: 'pending', ...producer } } : {}),
  })
  const id = String(doc._id)
  return { id, token: jwt.sign({ sub: id, role }, env.jwtSecret, { expiresIn: '1h', algorithm: 'HS256' }) }
}

async function call(path: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(`${baseUrl}${path}`, { headers })
  return { status: res.status, body: (await res.json()) as any }
}

const PATHS = ['/api/admin/summary', '/api/admin/users', '/api/admin/orders', '/api/admin/auctions']

test('401 without token and 403 for buyer and producer tokens on all four', async () => {
  const buyer = await createUser('buyer')
  const producer = await createUser('producer', { status: 'approved' })
  for (const path of PATHS) {
    const anon = await call(path)
    assert.equal(anon.status, 401, path)
    assert.equal(anon.body.error.code, 'UNAUTHORIZED')
    for (const user of [buyer, producer]) {
      const res = await call(path, user.token)
      assert.equal(res.status, 403, `${path} ${user.token.slice(0, 8)}`)
      assert.equal(res.body.error.code, 'FORBIDDEN')
    }
  }
})

test('empty database returns empty lists with total 0, not 404', async () => {
  await mongoose.connection.dropDatabase()
  const admin = await createUser('admin')
  // The users list contains the requesting admin; orders and auctions are empty.
  const users = await call('/api/admin/users', admin.token)
  assert.equal(users.status, 200)
  assert.equal(users.body.total, 1)
  assert.equal(users.body.items.length, 1)
  assert.equal(users.body.items[0].id, admin.id)
  for (const path of ['/api/admin/orders', '/api/admin/auctions']) {
    const res = await call(path, admin.token)
    assert.equal(res.status, 200, path)
    assert.deepEqual(res.body, { items: [], total: 0 })
  }
})

test('page 2 of 9 users returns 1 item with total 9; a page past the end is empty', async () => {
  await mongoose.connection.dropDatabase()
  const admin = await createUser('admin')
  for (let i = 0; i < 8; i += 1) await createUser('buyer')
  const page2 = await call('/api/admin/users?page=2', admin.token)
  assert.equal(page2.status, 200)
  assert.equal(page2.body.total, 9)
  assert.equal(page2.body.items.length, 1)
  const page3 = await call('/api/admin/users?page=3', admin.token)
  assert.equal(page3.status, 200)
  assert.deepEqual(page3.body, { items: [], total: 9 })
})

test('users filter by role and q, map state, and never leak secrets', async () => {
  const admin = await createUser('admin')
  await createUser('buyer')
  const pending = await createUser('producer', { status: 'pending', farmName: 'Pending Farm' })
  await createUser('producer', { status: 'approved', farmName: 'Approved Farm' })

  const buyers = await call('/api/admin/users?role=buyer', admin.token)
  assert.equal(buyers.status, 200)
  assert.ok(buyers.body.total >= 1)
  assert.ok(buyers.body.items.every((u: any) => u.role === 'buyer'))

  const found = await call(`/api/admin/users?q=${pending.id.slice(-6)}`, admin.token)
  assert.equal(found.status, 200)
  assert.equal(found.body.total, 0)

  const byEmail = await call('/api/admin/users?q=be20l', admin.token)
  assert.equal(byEmail.status, 200)
  assert.ok(byEmail.body.total >= 4)

  const producers = await call('/api/admin/users?role=producer', admin.token)
  assert.equal(producers.status, 200)
  const pendingRow = producers.body.items.find((u: any) => u.id === pending.id)
  assert.ok(pendingRow)
  assert.equal(pendingRow.state, 'pending')
  assert.ok(producers.body.items.every((u: any) => ['active', 'pending'].includes(u.state)))
  assert.equal('suspended' in pendingRow, false)
  for (const item of producers.body.items) {
    assert.deepEqual(Object.keys(item).sort(), ['email', 'id', 'name', 'role', 'state'])
  }
  assert.equal(JSON.stringify(producers.body).includes('passwordHash'), false)

  const escaped = await call('/api/admin/users?q=.*', admin.token)
  assert.equal(escaped.status, 200)
  assert.equal(escaped.body.total, 0)
})

test('unknown role and page=0 return 400', async () => {
  const admin = await createUser('admin')
  for (const path of ['/api/admin/users?role=bogus', '/api/admin/users?page=0', '/api/admin/orders?status=bogus', '/api/admin/orders?page=0', '/api/admin/auctions?status=bogus', '/api/admin/auctions?page=0', '/api/admin/users?page=abc']) {
    const res = await call(path, admin.token)
    assert.equal(res.status, 400, path)
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
  }
})

test('orders filter by status, newest first, stable pages', async () => {
  await mongoose.connection.dropDatabase()
  const admin = await createUser('admin')
  const buyer = await UserModel.create({
    name: 'Order Buyer',
    email: `be20l.buyer.${counter}@example.com`,
    passwordHash: 'x',
    role: 'buyer',
  })
  const producer = await UserModel.create({
    name: 'Producer Person',
    email: `be20l.prod.${counter}@example.com`,
    passwordHash: 'x',
    role: 'producer',
    producer: { farmName: 'Order Farm', status: 'approved' },
  })
  const item = (name: string, price: number) => ({
    productId: new mongoose.Types.ObjectId(),
    name,
    price,
    quantity: 2,
    unit: 'jar',
  })
  const first = await OrderModel.create({
    buyer: buyer._id,
    producer: producer._id,
    items: [item('Honey', 5)],
    total: 10,
    status: 'pending',
    fulfilment: 'pickup',
  })
  await OrderModel.create({
    buyer: buyer._id,
    producer: producer._id,
    items: [item('Wine', 9)],
    total: 9,
    status: 'delivered',
    fulfilment: 'pickup',
  })

  const all = await call('/api/admin/orders', admin.token)
  assert.equal(all.status, 200)
  assert.equal(all.body.total, 2)
  assert.equal(all.body.items.length, 2)
  // Newest first with an _id tiebreaker.
  assert.ok(all.body.items[0].createdAt >= all.body.items[1].createdAt)
  assert.deepEqual(Object.keys(all.body.items[0]).sort(), ['buyerName', 'createdAt', 'id', 'itemCount', 'producerName', 'status', 'total'])
  assert.equal(all.body.items[0].buyerName, 'Order Buyer')
  assert.equal(all.body.items[0].producerName, 'Order Farm')
  assert.equal(all.body.items[0].itemCount, 1)

  const pending = await call('/api/admin/orders?status=pending', admin.token)
  assert.equal(pending.status, 200)
  assert.deepEqual(pending.body, {
    items: pending.body.items,
    total: 1,
  })
  assert.equal(pending.body.items[0].id, String(first._id))

  const pastEnd = await call('/api/admin/orders?status=pending&page=2', admin.token)
  assert.equal(pastEnd.status, 200)
  assert.deepEqual(pastEnd.body, { items: [], total: 1 })
})

test('auctions include drafts and filter by status', async () => {
  await mongoose.connection.dropDatabase()
  const admin = await createUser('admin')
  const producer = await UserModel.create({
    name: 'Auction Person',
    email: `be20l.auct.${counter}@example.com`,
    passwordHash: 'x',
    role: 'producer',
    producer: { farmName: 'Auction Farm', status: 'approved' },
  })
  const now = new Date()
  const base = {
    producer: producer._id,
    product: new mongoose.Types.ObjectId(),
    productName: 'Honey',
    category: 'honey',
    unit: 'jar',
    quantity: 2,
    basePrice: 5,
    increment: 0.5,
    durationMinutes: 60,
    startsAt: now,
    endsAt: new Date(now.getTime() + 3_600_000),
    currentPrice: 5,
  }
  const draft = await AuctionModel.create({ ...base, status: 'draft' })
  await AuctionModel.create({ ...base, status: 'active' })

  const all = await call('/api/admin/auctions', admin.token)
  assert.equal(all.status, 200)
  assert.equal(all.body.total, 2)
  assert.ok(all.body.items.some((a: any) => a.id === String(draft._id) && a.status === 'draft'))

  const drafts = await call('/api/admin/auctions?status=draft', admin.token)
  assert.equal(drafts.status, 200)
  assert.equal(drafts.body.total, 1)
  assert.equal(drafts.body.items[0].id, String(draft._id))
  assert.deepEqual(Object.keys(drafts.body.items[0]).sort(), ['bidCount', 'currentPrice', 'endsAt', 'id', 'producer', 'product', 'startsAt', 'status'])
  assert.deepEqual(drafts.body.items[0].product, { id: drafts.body.items[0].product.id, name: 'Honey', category: 'honey' })
  assert.deepEqual(drafts.body.items[0].producer, { id: String(producer._id), name: 'Auction Farm' })
  assert.equal(drafts.body.items[0].bidCount, 0)

  const pastEnd = await call('/api/admin/auctions?status=draft&page=2', admin.token)
  assert.equal(pastEnd.status, 200)
  assert.deepEqual(pastEnd.body, { items: [], total: 1 })
})
