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
    email: `be20o.${counter}@example.com`,
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

test('empty database returns zeros and empty arrays, not 404', async () => {
  const admin = await createUser('admin')
  const res = await call('/api/admin/summary', admin.token)
  assert.equal(res.status, 200)
  assert.equal(res.body.users, 0)
  assert.equal(res.body.orders, 0)
  assert.equal(res.body.activeAuctions, 0)
  assert.equal(res.body.pendingProducers, 0)
  assert.deepEqual(res.body.byStatus, { pending: 0, confirmed: 0, ready: 0, delivered: 0 })
  assert.equal(res.body.salesPerDay.length, 7)
  for (const point of res.body.salesPerDay) assert.equal(point.total, 0)
})

test('401 without token and 403 for buyer and producer tokens', async () => {
  const buyer = await createUser('buyer')
  const producer = await createUser('producer', { status: 'approved' })
  const anon = await call('/api/admin/summary')
  assert.equal(anon.status, 401)
  assert.equal(anon.body.error.code, 'UNAUTHORIZED')
  for (const user of [buyer, producer]) {
    const res = await call('/api/admin/summary', user.token)
    assert.equal(res.status, 403)
    assert.equal(res.body.error.code, 'FORBIDDEN')
  }
})

test('summary counts, byStatus and salesPerDay exclude cancelled orders', async () => {
  await mongoose.connection.dropDatabase()
  const admin = await createUser('admin')
  const buyer = await createUser('buyer')
  const pending = await createUser('producer', { status: 'pending' })
  const approved = await createUser('producer', { status: 'approved' })
  const buyerId = new mongoose.Types.ObjectId(buyer.id)
  const approvedId = new mongoose.Types.ObjectId(approved.id)

  const item = (name: string, price: number) => ({
    productId: new mongoose.Types.ObjectId(),
    name,
    price,
    quantity: 1,
    unit: 'jar',
  })
  await OrderModel.create([
    { buyer: buyerId, producer: approvedId, items: [item('Honey', 10)], total: 10, status: 'pending', fulfilment: 'pickup' },
    { buyer: buyerId, producer: approvedId, items: [item('Honey', 7.5)], total: 7.5, status: 'confirmed', fulfilment: 'pickup' },
    { buyer: buyerId, producer: approvedId, items: [item('Honey', 4)], total: 4, status: 'delivered', fulfilment: 'pickup' },
    { buyer: buyerId, producer: approvedId, items: [item('Honey', 100)], total: 100, status: 'cancelled', fulfilment: 'pickup' },
  ])
  const now = new Date()
  await AuctionModel.create([
    {
      producer: approvedId,
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
      status: 'active',
      currentPrice: 5,
    },
    {
      producer: approvedId,
      product: new mongoose.Types.ObjectId(),
      productName: 'Wine',
      category: 'wine',
      unit: 'bottle',
      quantity: 1,
      basePrice: 9,
      increment: 1,
      durationMinutes: 60,
      startsAt: now,
      endsAt: new Date(now.getTime() + 3_600_000),
      status: 'ended',
      currentPrice: 12,
      bidCount: 3,
    },
  ])

  const res = await call('/api/admin/summary', admin.token)
  assert.equal(res.status, 200)
  assert.equal(res.body.users, 3, JSON.stringify(res.body))
  assert.equal(res.body.orders, 4)
  assert.equal(res.body.activeAuctions, 1)
  assert.equal(res.body.pendingProducers, 1)
  assert.deepEqual(res.body.byStatus, { pending: 1, confirmed: 1, ready: 0, delivered: 1 })
  assert.equal(res.body.salesPerDay.length, 7)
  const total = res.body.salesPerDay.reduce((sum: number, p: any) => sum + p.total, 0)
  assert.equal(total, 21.5)
  assert.ok(pending.id)
})
