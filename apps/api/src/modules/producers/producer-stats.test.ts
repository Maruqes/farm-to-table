import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { localDayStart, recentLocalDays } from '../../lib/days.js'
import { AuctionModel } from '../auctions/auctions.model.js'
import { OrderModel, type OrderStatus } from '../orders/orders.model.js'
import { ProductModel } from '../products/products.model.js'
import { UserModel, type ProducerEmbedded, type UserRole } from '../users/users.model.js'

let server: Server
let baseUrl = ''
let counter = 0
let productCounter = 0

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  await Promise.all([
    UserModel.syncIndexes(),
    ProductModel.syncIndexes(),
    OrderModel.syncIndexes(),
    AuctionModel.syncIndexes(),
  ])
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

async function createUser(role: UserRole, name: string, producer?: Partial<ProducerEmbedded>) {
  counter += 1
  const doc = await UserModel.create({
    name,
    email: `s${counter}@example.com`,
    passwordHash: 'x',
    role,
    ...(producer ? { producer: { farmName: name, ...producer } } : {}),
  })
  const id = String(doc._id)
  return { id, token: jwt.sign({ sub: id, role }, env.jwtSecret, { expiresIn: '1h', algorithm: 'HS256' }) }
}

async function call(path: string, method = 'GET', token?: string, body?: unknown) {
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: res.status, body: (await res.json()) as any }
}

const producer = (name: string, extra: Partial<ProducerEmbedded> = {}) =>
  createUser('producer', name, { status: 'approved', location: 'Douro, Portugal', ...extra })

const stats = (token?: string) => call('/api/producers/me/stats', 'GET', token)

async function product(producerId: string, over: Record<string, unknown> = {}) {
  productCounter += 1
  const doc = await ProductModel.create({
    producer: producerId,
    name: `Stats product ${productCounter}`,
    category: 'honey',
    price: 5,
    unit: 'jar',
    stock: 10,
    season: 'all-year',
    organic: false,
    ...over,
  })
  return String(doc._id)
}

async function order(producerId: string, buyerId: string, total: number, status: OrderStatus, createdAt?: Date) {
  const doc = await OrderModel.create({
    buyer: buyerId,
    producer: producerId,
    items: [{ productId: new mongoose.Types.ObjectId(), name: 'Stats item', price: total, quantity: 1, unit: 'jar' }],
    total,
    status,
    history: [{ status, date: createdAt ?? new Date() }],
    fulfilment: 'pickup',
    address: null,
  })
  if (createdAt) await OrderModel.collection.updateOne({ _id: doc._id }, { $set: { createdAt } })
  return String(doc._id)
}

async function auction(producerId: string, productId: string, over: Record<string, unknown> = {}) {
  const now = Date.now()
  const doc = await AuctionModel.create({
    producer: producerId,
    product: productId,
    productName: 'Stats lot',
    category: 'honey',
    unit: 'jar',
    quantity: 10,
    basePrice: 5,
    increment: 1,
    durationMinutes: 60,
    startsAt: new Date(now - 10 * 60_000),
    endsAt: new Date(now + 30 * 60_000),
    status: 'active',
    cancelled: false,
    currentPrice: 12,
    bidCount: 3,
    leader: null,
    winner: null,
    lastViewers: 0,
    ...over,
  })
  return String(doc._id)
}

async function setRating(producerId: string, averageRating: number) {
  await UserModel.updateOne(
    { _id: producerId },
    { $set: { 'producer.averageRating': averageRating, 'producer.ratingCount': 3 } },
    { strict: false },
  )
}

test('stats match a small fixture and fill the seven local days', async () => {
  const buyer = await createUser('buyer', 'Stats Buyer')
  const farm = await producer('Stats Farm')
  await setRating(farm.id, 4.5)

  const days = recentLocalDays()
  const outOfStock = await product(farm.id, { name: 'Out-of-stock honey', stock: 0 })
  const low = await product(farm.id, { name: 'Low honey', stock: 2 })
  const boundary = await product(farm.id, { name: 'Boundary cider', stock: 5 })
  const plenty = await product(farm.id, { name: 'Plenty cheese', stock: 9 })
  await product(farm.id, { name: 'Hidden jam', stock: 1, hidden: true })

  await order(farm.id, buyer.id, 10, 'pending')
  await order(farm.id, buyer.id, 7.5, 'confirmed', new Date(localDayStart(days[5]!).getTime() + 12 * 60 * 60 * 1000))
  await order(farm.id, buyer.id, 99, 'cancelled')
  await order(farm.id, buyer.id, 50, 'delivered', new Date(localDayStart(days[0]!).getTime() - 1))

  const soonest = await auction(farm.id, plenty, {
    productName: 'Plenty cheese',
    endsAt: new Date(Date.now() + 30 * 60_000),
    currentPrice: 12,
    bidCount: 3,
  })
  await auction(farm.id, plenty, { endsAt: new Date(Date.now() + 60 * 60_000) })
  await auction(farm.id, plenty, { status: 'scheduled', endsAt: new Date(Date.now() + 10 * 60_000) })

  const res = await stats(farm.token)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, {
    sales: 17.5,
    toHandle: 2,
    activeProducts: 3,
    averageRating: 4.5,
    salesPerDay: days.map((day, index) => ({ day, total: index === 5 ? 7.5 : index === 6 ? 10 : 0 })),
    byStatus: { pending: 1, confirmed: 1, ready: 0, delivered: 1 },
    lowStock: [
      { productId: outOfStock, name: 'Out-of-stock honey', stock: 0 },
      { productId: low, name: 'Low honey', stock: 2 },
      { productId: boundary, name: 'Boundary cider', stock: 5 },
    ],
    activeAuction: {
      id: soonest,
      product: { id: plenty, name: 'Plenty cheese' },
      currentPrice: 12,
      bidCount: 3,
      viewers: 0,
    },
  })

  const raw = JSON.stringify(res.body)
  for (const leaked of ['passwordHash', 'email', 'card', 'rejectReason', '_id', '__v']) {
    assert.ok(!raw.includes(leaked), leaked)
  }
})

test('a producer with no data gets zeros, seven empty days and empty arrays', async () => {
  const farm = await producer('Empty Farm')
  const days = recentLocalDays()

  const res = await stats(farm.token)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, {
    sales: 0,
    toHandle: 0,
    activeProducts: 0,
    averageRating: 0,
    salesPerDay: days.map((day) => ({ day, total: 0 })),
    byStatus: { pending: 0, confirmed: 0, ready: 0, delivered: 0 },
    lowStock: [],
    activeAuction: null,
  })
})

test('another producer data never changes the result', async () => {
  const buyer = await createUser('buyer', 'Isolation Buyer')
  const mine = await producer('Isolation Mine')
  const other = await producer('Isolation Other')

  const otherProduct = await product(other.id, { name: 'Other low stock', stock: 1 })
  await order(other.id, buyer.id, 500, 'pending')
  const otherAuction = await auction(other.id, otherProduct, { currentPrice: 999, bidCount: 42 })

  const res = await stats(mine.token)
  assert.equal(res.status, 200)
  assert.equal(res.body.sales, 0)
  assert.equal(res.body.toHandle, 0)
  assert.equal(res.body.activeProducts, 0)
  assert.equal(res.body.averageRating, 0)
  assert.deepEqual(res.body.byStatus, { pending: 0, confirmed: 0, ready: 0, delivered: 0 })
  assert.deepEqual(res.body.lowStock, [])
  assert.equal(res.body.activeAuction, null)
  assert.equal(res.body.salesPerDay.length, 7)
  for (const point of res.body.salesPerDay) assert.equal(point.total, 0)

  const theirs = await stats(other.token)
  assert.equal(theirs.status, 200)
  assert.equal(theirs.body.sales, 500)
  assert.equal(theirs.body.toHandle, 1)
  assert.equal(theirs.body.activeProducts, 1)
  assert.deepEqual(theirs.body.lowStock, [{ productId: otherProduct, name: 'Other low stock', stock: 1 }])
  assert.equal(theirs.body.activeAuction.id, otherAuction)
  assert.equal(theirs.body.activeAuction.product.id, otherProduct)
})

test('guards: 401 without a token, 403 for buyers and admins, 403 for unapproved producers', async () => {
  const noToken = await stats()
  assert.equal(noToken.status, 401)
  assert.equal(noToken.body.error.code, 'UNAUTHORIZED')

  const buyer = await createUser('buyer', 'Guard Buyer')
  const admin = await createUser('admin', 'Guard Admin')
  for (const user of [buyer, admin]) {
    const res = await stats(user.token)
    assert.equal(res.status, 403)
    assert.equal(res.body.error.code, 'FORBIDDEN')
  }

  const bare = await createUser('producer', 'Bare Producer')
  const pending = await producer('Guard Pending', { status: 'pending' })
  const rejected = await producer('Guard Rejected', { status: 'rejected' })
  for (const user of [bare, pending, rejected]) {
    const res = await stats(user.token)
    assert.equal(res.status, 403)
    assert.equal(res.body.error.code, 'PRODUCER_NOT_APPROVED')
  }
})

test('local-day edges: midnight starts the day and the window drops the previous millisecond', async () => {
  const buyer = await createUser('buyer', 'Edge Buyer')
  const farm = await producer('Edge Farm')
  const days = recentLocalDays()
  const oldestStart = localDayStart(days[0]!)
  const todayStart = localDayStart(days[6]!)

  await order(farm.id, buyer.id, 1, 'pending', todayStart)
  await order(farm.id, buyer.id, 2, 'pending', new Date(todayStart.getTime() - 1))
  await order(farm.id, buyer.id, 4, 'pending', oldestStart)
  await order(farm.id, buyer.id, 8, 'pending', new Date(oldestStart.getTime() - 1))

  const res = await stats(farm.token)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.salesPerDay, days.map((day, index) => ({
    day,
    total: index === 6 ? 1 : index === 5 ? 2 : index === 0 ? 4 : 0,
  })))
  assert.equal(res.body.sales, 7)
  assert.deepEqual(res.body.byStatus, { pending: 4, confirmed: 0, ready: 0, delivered: 0 })
})

test('day helpers follow Europe/Lisbon across daylight saving changes', () => {
  assert.deepEqual(recentLocalDays(7, new Date('2026-03-29T00:30:00Z')), [
    '2026-03-23', '2026-03-24', '2026-03-25', '2026-03-26', '2026-03-27', '2026-03-28', '2026-03-29',
  ])
  assert.deepEqual(recentLocalDays(7, new Date('2026-10-25T12:30:00Z')), [
    '2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25',
  ])
  assert.equal(localDayStart('2026-03-29').toISOString(), '2026-03-29T00:00:00.000Z')
  assert.equal(localDayStart('2026-03-30').toISOString(), '2026-03-29T23:00:00.000Z')
  assert.equal(localDayStart('2026-10-25').toISOString(), '2026-10-24T23:00:00.000Z')
  assert.equal(localDayStart('2026-10-26').toISOString(), '2026-10-26T00:00:00.000Z')
})

test('low stock is capped at twenty, lowest first, and ignores hidden products', async () => {
  const farm = await producer('Stock Farm')
  for (let index = 0; index < 22; index += 1) {
    await product(farm.id, { name: `Low ${String(index).padStart(2, '0')}`, stock: 1 })
  }
  await product(farm.id, { name: 'Hidden low', stock: 0, hidden: true })

  const res = await stats(farm.token)
  assert.equal(res.status, 200)
  assert.equal(res.body.lowStock.length, 20)
  assert.deepEqual(
    res.body.lowStock.map((item: any) => item.name),
    Array.from({ length: 20 }, (_, index) => `Low ${String(index).padStart(2, '0')}`),
  )
  assert.equal(res.body.activeProducts, 22)
})

test('a hidden producer page has no active products', async () => {
  const farm = await producer('Hidden Farm', { hidden: true })
  await product(farm.id, { name: 'Visible stock', stock: 3 })

  const res = await stats(farm.token)
  assert.equal(res.status, 200)
  assert.equal(res.body.activeProducts, 0)
  assert.deepEqual(res.body.lowStock.map((item: any) => item.name), ['Visible stock'])
})
