import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { Server as IoServer } from 'socket.io'
import { io as connectClient } from 'socket.io-client'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { attach } from '../../realtime/socket.js'
import { UserModel, type ProducerEmbedded, type UserRole } from '../users/users.model.js'
import { ProductModel } from '../products/products.model.js'
import { NotificationModel } from '../notifications/notifications.model.js'
import { OrderModel } from './orders.model.js'
import { createOrder } from './orders.service.js'

let server: Server
let baseUrl = ''
let socketHttp: Server
let ioServer: IoServer
let socketUrl = ''
let counter = 0

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  await Promise.all([UserModel.syncIndexes(), ProductModel.syncIndexes(), OrderModel.syncIndexes(), NotificationModel.syncIndexes()])
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  socketHttp = createServer()
  ioServer = new IoServer(socketHttp)
  attach(ioServer)
  await new Promise<void>((r) => socketHttp.listen(0, r))
  socketUrl = `http://127.0.0.1:${(socketHttp.address() as { port: number }).port}`
})

after(async () => {
  await ioServer.close()
  await new Promise<void>((resolve) => server.close(() => resolve()))
  await disconnect()
})

async function createUser(role: UserRole, name: string, producer?: Partial<ProducerEmbedded>) {
  counter += 1
  const email = `o${counter}@example.com`
  const doc = await UserModel.create({
    name,
    email,
    passwordHash: 'x',
    role,
    ...(producer ? { producer: { farmName: name, ...producer } } : {}),
  })
  const id = String(doc._id)
  return { id, email, token: jwt.sign({ sub: id, role }, env.jwtSecret, { expiresIn: '1h', algorithm: 'HS256' }) }
}

async function call(path: string, method = 'GET', token?: string, body?: unknown) {
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'
  const res = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: res.status, body: (await res.json()) as any }
}

const buyer = (name = 'Buyer') => createUser('buyer', name)
const producer = (name: string, extra: Partial<ProducerEmbedded> = {}) =>
  createUser('producer', name, { status: 'approved', location: 'Douro, Portugal', ...extra })

let n = 0
async function product(producerId: string, over: Record<string, unknown> = {}) {
  n += 1
  const doc = await ProductModel.create({
    producer: producerId,
    name: `Order prod ${n}`,
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

const putCart = (token: string, items: unknown) => call('/api/cart', 'PUT', token, { items })
const checkout = (token: string, body: unknown) => call('/api/orders', 'POST', token, body)
const mine = (token: string) => call('/api/orders/mine', 'GET', token)

const stockOf = async (id: string) => (await ProductModel.findById(id).select('stock').lean())!.stock

test('401 without token, 403 for producer and admin', async () => {
  const p = await producer('Auth Farm')
  const admin = await createUser('admin', 'Admin')
  const noToken = await call('/api/orders', 'POST', undefined, { fulfilment: 'pickup' })
  assert.equal(noToken.status, 401)
  assert.equal(noToken.body.error.code, 'UNAUTHORIZED')
  assert.equal((await call('/api/orders/mine')).status, 401)
  for (const u of [p, admin]) {
    const post = await checkout(u.token, { fulfilment: 'pickup' })
    assert.equal(post.status, 403)
    assert.equal(post.body.error.code, 'FORBIDDEN')
    const list = await mine(u.token)
    assert.equal(list.status, 403)
    assert.equal(list.body.error.code, 'FORBIDDEN')
  }
})

test('empty cart is a 400 VALIDATION_ERROR', async () => {
  const b = await buyer()
  const res = await checkout(b.token, { fulfilment: 'pickup' })
  assert.equal(res.status, 400)
  assert.equal(res.body.error.code, 'VALIDATION_ERROR')
})

test('validation: bad fulfilment, missing address, bad address fields; nothing is created', async () => {
  const b = await buyer()
  const p = await producer('Validation Farm')
  const id = await product(p.id, { stock: 6 })
  assert.equal((await putCart(b.token, [{ productId: id, quantity: 2 }])).status, 200)

  const bad = async (body: unknown) => {
    const res = await checkout(b.token, body)
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    return res.body.error.fields as Record<string, string>
  }

  assert.ok((await bad({})).fulfilment)
  assert.ok((await bad({ fulfilment: 'drone' })).fulfilment)
  const noAddress = await bad({ fulfilment: 'delivery' })
  assert.deepEqual(Object.keys(noAddress).sort(), ['city', 'line1', 'postalCode'])
  const missingOne = await bad({ fulfilment: 'delivery', address: { line1: 'Rua 1', city: 'Viana' } })
  assert.deepEqual(Object.keys(missingOne), ['postalCode'])
  const emptyFields = await bad({ fulfilment: 'delivery', address: { line1: '', city: ' ', postalCode: '' } })
  assert.deepEqual(Object.keys(emptyFields).sort(), ['city', 'line1', 'postalCode'])
  assert.equal((await checkout(b.token, 'nope')).status, 400)

  assert.equal(await stockOf(id), 6)
  assert.equal((await call('/api/cart', 'GET', b.token)).body.items[0].quantity, 2)
  assert.equal(await OrderModel.countDocuments({ buyer: b.id }), 0)
})

test('a pickup order ignores the address; a delivery order stores it', async () => {
  const b = await buyer()
  const p = await producer('Address Farm')
  const id = await product(p.id, { stock: 10 })
  await putCart(b.token, [{ productId: id, quantity: 1 }])
  const pickup = await checkout(b.token, { fulfilment: 'pickup', address: 'not-an-object' })
  assert.equal(pickup.status, 201)
  const pickupDoc = await OrderModel.findById(pickup.body[0].id).lean()
  assert.equal(pickupDoc!.address, null)

  await putCart(b.token, [{ productId: id, quantity: 1 }])
  const delivery = await checkout(b.token, {
    fulfilment: 'delivery',
    address: { line1: 'Rua das Flores 1', city: 'Viana do Castelo', postalCode: '4900-001', extra: 'stripped' },
  })
  assert.equal(delivery.status, 201)
  const deliveryDoc = await OrderModel.findById(delivery.body[0].id).lean()
  assert.deepEqual(deliveryDoc!.address, { line1: 'Rua das Flores 1', city: 'Viana do Castelo', postalCode: '4900-001' })
})

test('two producers create two orders, copy lines, decrement stock and empty the cart', async () => {
  const b = await buyer('Happy Buyer')
  const p1 = await producer('Happy Farm One', { location: 'Minho' })
  const p2 = await producer('Happy Farm Two', { location: 'Douro' })
  const apples = await product(p1.id, { name: 'Apples', price: 2.25, stock: 10, unit: 'kg' })
  const cheese = await product(p1.id, { name: 'Cheese', price: 4.5, stock: 5, unit: 'wheel' })
  const honey = await product(p2.id, { name: 'Honey', price: 7.1, stock: 4, unit: 'jar' })
  await putCart(b.token, [
    { productId: apples, quantity: 2 },
    { productId: honey, quantity: 1 },
    { productId: cheese, quantity: 2 },
  ])

  const res = await checkout(b.token, { fulfilment: 'pickup' })
  assert.equal(res.status, 201)
  assert.equal(res.body.length, 2)
  assert.deepEqual(Object.keys(res.body[0]).sort(), ['id', 'items', 'producer', 'status', 'total'])
  assert.equal(res.body[0].producer.id, p1.id)
  assert.equal(res.body[0].producer.name, 'Happy Farm One')
  assert.equal(res.body[0].producer.location, 'Minho')
  assert.equal(res.body[0].status, 'pending')
  assert.equal(res.body[0].total, 13.5)
  assert.deepEqual(res.body[0].items.map((i: any) => i.productId), [apples, cheese])
  assert.deepEqual(res.body[0].items[0], { productId: apples, name: 'Apples', price: 2.25, quantity: 2, unit: 'kg' })
  assert.equal(res.body[1].producer.id, p2.id)
  assert.equal(res.body[1].total, 7.1)
  assert.deepEqual(res.body[1].items.map((i: any) => i.productId), [honey])

  assert.equal(await stockOf(apples), 8)
  assert.equal(await stockOf(cheese), 3)
  assert.equal(await stockOf(honey), 3)
  assert.deepEqual((await call('/api/cart', 'GET', b.token)).body, { items: [] })

  const docs = await OrderModel.find({ buyer: b.id }).sort({ createdAt: 1 }).lean()
  assert.equal(docs.length, 2)
  for (const doc of docs) {
    assert.equal(doc.status, 'pending')
    assert.equal(doc.fulfilment, 'pickup')
    assert.equal(doc.address, null)
    assert.equal(doc.history.length, 1)
    assert.equal(doc.history[0]!.status, 'pending')
    assert.ok(doc.history[0]!.date instanceof Date)
  }
})

test('client-sent items, prices and totals are ignored; the server cart wins', async () => {
  const b = await buyer()
  const p = await producer('Server Cart Farm')
  const real = await product(p.id, { name: 'Real', price: 8, stock: 5 })
  const fake = await product(p.id, { name: 'Fake', price: 0.01, stock: 50 })
  await putCart(b.token, [{ productId: real, quantity: 2 }])

  const res = await call('/api/orders', 'POST', b.token, {
    fulfilment: 'pickup',
    items: [{ productId: fake, quantity: 99, price: 0.01 }],
    total: 0.01,
    buyer: 'someone-else',
    producer: 'someone-else',
  })
  assert.equal(res.status, 201)
  assert.equal(res.body.length, 1)
  assert.deepEqual(res.body[0].items, [{ productId: real, name: 'Real', price: 8, quantity: 2, unit: 'jar' }])
  assert.equal(res.body[0].total, 16)
  assert.equal(await stockOf(real), 3)
  assert.equal(await stockOf(fake), 50)
})

test('409 STOCK_CHANGED restores every decrement and keeps the cart and stock exactly as before', async () => {
  const b = await buyer()
  const p1 = await producer('Rollback Farm One')
  const p2 = await producer('Rollback Farm Two')
  const enough = await product(p1.id, { stock: 5 })
  const low = await product(p2.id, { stock: 5 })
  const items = [{ productId: enough, quantity: 2 }, { productId: low, quantity: 2 }]
  await putCart(b.token, items)
  await ProductModel.updateOne({ _id: low }, { stock: 1 })
  const cartBefore = (await call('/api/cart', 'GET', b.token)).body

  const res = await checkout(b.token, { fulfilment: 'pickup' })
  assert.equal(res.status, 409)
  assert.equal(res.body.error.code, 'STOCK_CHANGED')
  assert.equal(await stockOf(enough), 5)
  assert.equal(await stockOf(low), 1)
  assert.deepEqual((await call('/api/cart', 'GET', b.token)).body, cartBefore)
  assert.equal(await OrderModel.countDocuments({ buyer: b.id }), 0)
})

test('two buyers racing for the last unit: one order, stock ends at 0', async () => {
  const p = await producer('Race Farm')
  const id = await product(p.id, { stock: 1 })
  const b1 = await buyer('Race One')
  const b2 = await buyer('Race Two')
  await putCart(b1.token, [{ productId: id, quantity: 1 }])
  await putCart(b2.token, [{ productId: id, quantity: 1 }])

  const [r1, r2] = await Promise.all([checkout(b1.token, { fulfilment: 'pickup' }), checkout(b2.token, { fulfilment: 'pickup' })])
  const statuses = [r1.status, r2.status].sort()
  assert.deepEqual(statuses, [201, 409])
  const failed = r1.status === 409 ? r1 : r2
  assert.equal(failed.body.error.code, 'STOCK_CHANGED')
  assert.equal(await stockOf(id), 0)
  assert.equal(await OrderModel.countDocuments({ items: { $elemMatch: { productId: id } } }), 1)

  const loser = r1.status === 409 ? b1 : b2
  const winner = r1.status === 201 ? b1 : b2
  assert.equal((await call('/api/cart', 'GET', loser.token)).body.items[0].quantity, 1)
  assert.deepEqual((await call('/api/cart', 'GET', winner.token)).body, { items: [] })
})

test('a later price change does not alter the stored order lines', async () => {
  const b = await buyer()
  const p = await producer('Price Lock Farm')
  const id = await product(p.id, { name: 'Original', price: 8, stock: 10 })
  await putCart(b.token, [{ productId: id, quantity: 2 }])
  assert.equal((await checkout(b.token, { fulfilment: 'pickup' })).status, 201)

  await ProductModel.updateOne({ _id: id }, { name: 'Changed', price: 99 })
  const res = await mine(b.token)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body[0].items, [{ productId: id, name: 'Original', price: 8, quantity: 2, unit: 'jar' }])
  assert.equal(res.body[0].total, 16)
})

test('GET /mine returns own orders newest first with producer contact and no leaked account fields', async () => {
  const b = await buyer('Mine Buyer')
  const p = await producer('Mine Farm', { location: 'Viana do Castelo', lat: 41.69, lng: -8.83 })
  const id = await product(p.id, { price: 3, stock: 10 })
  await putCart(b.token, [{ productId: id, quantity: 2 }])
  const created = await checkout(b.token, {
    fulfilment: 'delivery',
    address: { line1: 'Rua 1', city: 'Viana', postalCode: '4900' },
  })
  assert.equal(created.status, 201)

  const older = await OrderModel.insertMany([{
    buyer: b.id,
    producer: p.id,
    items: [{ productId: new mongoose.Types.ObjectId(id), name: 'Old', price: 1, quantity: 1, unit: 'kg' }],
    total: 1,
    status: 'delivered',
    history: [
      { status: 'pending', date: new Date('2026-01-01T10:00:00.000Z') },
      { status: 'delivered', date: new Date('2026-01-02T10:00:00.000Z') },
    ],
    fulfilment: 'pickup',
    address: null,
    createdAt: new Date('2026-01-01T10:00:00.000Z'),
    updatedAt: new Date('2026-01-02T10:00:00.000Z'),
  }])

  const res = await mine(b.token)
  assert.equal(res.status, 200)
  assert.equal(res.body.length, 2)
  assert.equal(res.body[0].id, created.body[0].id)
  assert.equal(res.body[1].id, String(older[0]!._id))
  const order = res.body[0]
  assert.deepEqual(Object.keys(order).sort(), ['history', 'id', 'items', 'producer', 'reviewed', 'status', 'total'])
  assert.equal(order.status, 'pending')
  assert.equal(order.reviewed, false)
  assert.equal(order.total, 6)
  assert.equal(order.history.length, 1)
  assert.equal(order.history[0].status, 'pending')
  assert.ok(!Number.isNaN(Date.parse(order.history[0].date)))
  assert.deepEqual(order.producer, {
    id: p.id,
    name: 'Mine Farm',
    location: 'Viana do Castelo',
    email: p.email,
    lat: 41.69,
    lng: -8.83,
  })
  assert.deepEqual(res.body[1].history.map((h: any) => h.status), ['pending', 'delivered'])
  const raw = JSON.stringify(res.body)
  for (const leaked of ['passwordHash', 'password', 'card', '_id', 'rejectReason']) assert.ok(!raw.includes(leaked), leaked)

  const other = await buyer('Other Buyer')
  assert.deepEqual((await mine(other.token)).body, [])
})

test('checkout emits order-created to the producer and stores an order-new notification', async () => {
  const b = await buyer('Socket Buyer')
  const p = await producer('Socket Farm')
  const id = await product(p.id, { price: 5, stock: 10 })
  await putCart(b.token, [{ productId: id, quantity: 2 }])

  const socket = connectClient(socketUrl, { auth: { token: p.token }, forceNew: true, reconnection: false })
  try {
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () => resolve())
      socket.once('connect_error', reject)
    })
    const pushed = new Promise<any>((resolve) => socket.once('order-created', resolve))
    const res = await checkout(b.token, {
      fulfilment: 'delivery',
      address: { line1: 'Rua 2', city: 'Viana', postalCode: '4900' },
    })
    assert.equal(res.status, 201)
    const got = await Promise.race([
      pushed,
      new Promise((_, reject) => setTimeout(() => reject(new Error('no order-created received')), 2000)),
    ])
    assert.deepEqual(Object.keys(got).sort(), ['address', 'buyer', 'createdAt', 'fulfilment', 'id', 'items', 'status', 'total', 'updatedAt'])
    assert.equal(got.id, res.body[0].id)
    assert.equal(got.status, 'pending')
    assert.equal(got.fulfilment, 'delivery')
    assert.deepEqual(got.address, { line1: 'Rua 2', city: 'Viana', postalCode: '4900' })
    assert.deepEqual(got.buyer, { id: b.id, name: 'Socket Buyer', email: b.email })
    assert.deepEqual(got.items, [{ productId: id, name: `Order prod ${n}`, price: 5, quantity: 2, unit: 'jar' }])
    assert.equal(got.total, 10)
    assert.ok(!Number.isNaN(Date.parse(got.createdAt)))
    assert.ok(!Number.isNaN(Date.parse(got.updatedAt)))

    const note = await NotificationModel.findOne({ user: p.id, type: 'order-new' }).lean()
    assert.ok(note)
    assert.ok(note!.text.includes('Socket Buyer'))
  } finally {
    socket.close()
  }
})

test('createOrder persists an auction order for BE-16 with a rounded total and pending history', async () => {
  const b = await buyer()
  const p = await producer('Auction Order Farm')
  const auctionId = new mongoose.Types.ObjectId().toString()
  const order = await createOrder({
    buyer: b.id,
    producer: p.id,
    items: [{ productId: new mongoose.Types.ObjectId().toString(), name: 'Kiwi lot', price: 12.34, quantity: 3, unit: 'kg' }],
    fulfilment: 'delivery',
    address: { line1: 'Rua 3', city: 'Viana', postalCode: '4900' },
    auction: auctionId,
  })
  const doc = await OrderModel.findById(order._id).lean()
  assert.ok(doc)
  assert.equal(doc!.buyer.toString(), b.id)
  assert.equal(doc!.producer.toString(), p.id)
  assert.equal(doc!.status, 'pending')
  assert.equal(doc!.total, 37.02)
  assert.equal(doc!.history.length, 1)
  assert.equal(doc!.history[0]!.status, 'pending')
  assert.equal(doc!.fulfilment, 'delivery')
  assert.deepEqual(doc!.address, { line1: 'Rua 3', city: 'Viana', postalCode: '4900' })
  assert.equal(doc!.auction!.toString(), auctionId)
})
