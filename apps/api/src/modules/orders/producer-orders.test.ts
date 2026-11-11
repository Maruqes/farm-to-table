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
  const email = `p${counter}@example.com`
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
    name: `Producer order prod ${n}`,
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
const list = (token: string) => call('/api/orders?producer=me', 'GET', token)
const setStatus = (token: string, id: string, status: unknown) => call(`/api/orders/${id}/status`, 'PATCH', token, { status })

const stockOf = async (id: string) => (await ProductModel.findById(id).select('stock').lean())!.stock

async function placeOrder(token: string, items: unknown, body: unknown = { fulfilment: 'pickup' }) {
  assert.equal((await putCart(token, items)).status, 200)
  const res = await checkout(token, body)
  assert.equal(res.status, 201)
  return res.body[0]
}

function openSocket(token: string) {
  const socket = connectClient(socketUrl, { auth: { token }, forceNew: true, reconnection: false })
  return new Promise<typeof socket>((resolve, reject) => {
    socket.once('connect', () => resolve(socket))
    socket.once('connect_error', reject)
  })
}

test('GET and PATCH guards: 401 without token, 403 for buyer/admin and unapproved producers', async () => {
  const p = await producer('Guard Farm')
  const b = await buyer('Guard Buyer')
  const admin = await createUser('admin', 'Guard Admin')
  const pending = await producer('Guard Pending', { status: 'pending' })
  const rejected = await producer('Guard Rejected', { status: 'rejected' })
  const id = String(new mongoose.Types.ObjectId())

  assert.equal((await call('/api/orders?producer=me')).status, 401)
  assert.equal((await call('/api/orders?producer=me')).body.error.code, 'UNAUTHORIZED')
  assert.equal((await call(`/api/orders/${id}/status`, 'PATCH')).status, 401)
  assert.equal((await call(`/api/orders/${id}/status`, 'PATCH', undefined, { status: 'confirmed' })).status, 401)

  for (const u of [b, admin]) {
    const get = await list(u.token)
    assert.equal(get.status, 403)
    assert.equal(get.body.error.code, 'FORBIDDEN')
    const patch = await setStatus(u.token, id, 'confirmed')
    assert.equal(patch.status, 403)
    assert.equal(patch.body.error.code, 'FORBIDDEN')
  }

  for (const u of [pending, rejected]) {
    assert.equal((await list(u.token)).status, 403)
    assert.equal((await list(u.token)).body.error.code, 'PRODUCER_NOT_APPROVED')
    assert.equal((await setStatus(u.token, id, 'confirmed')).body.error.code, 'PRODUCER_NOT_APPROVED')
  }

  assert.equal((await list(p.token)).status, 200)
})

test('GET requires producer=me; any other value is a 400 VALIDATION_ERROR', async () => {
  const p = await producer('Query Farm')
  for (const path of ['/api/orders', '/api/orders?producer=other', '/api/orders?producer=', '/api/orders?producer=ME']) {
    const res = await call(path, 'GET', p.token)
    assert.equal(res.status, 400, path)
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    assert.ok(res.body.error.fields.producer, path)
  }
})

test('GET lists only the producer orders, newest first, with the CT-14 shape and no leaked fields', async () => {
  const b = await buyer('List Buyer')
  const p1 = await producer('List Farm One', { location: 'Minho' })
  const p2 = await producer('List Farm Two')
  const p3 = await producer('List Farm Three')
  const apples = await product(p1.id, { name: 'Apples', price: 2.25, stock: 10, unit: 'kg' })
  const cheese = await product(p1.id, { name: 'Cheese', price: 4.5, stock: 10, unit: 'wheel' })
  const honey = await product(p2.id, { name: 'Honey', price: 7.1, stock: 10, unit: 'jar' })

  assert.equal((await putCart(b.token, [
    { productId: apples, quantity: 2 },
    { productId: honey, quantity: 1 },
  ])).status, 200)
  const split = await checkout(b.token, { fulfilment: 'pickup' })
  assert.equal(split.status, 201)
  const first = split.body[0]
  const p2Order = split.body[1]
  const older = await placeOrder(b.token, [{ productId: apples, quantity: 1 }])
  const delivery = await placeOrder(
    b.token,
    [{ productId: cheese, quantity: 2 }],
    { fulfilment: 'delivery', address: { line1: 'Rua das Flores 1', city: 'Viana do Castelo', postalCode: '4900-001' } },
  )
  await OrderModel.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(older.id) },
    { $set: { createdAt: new Date('2026-01-01T10:00:00.000Z') } },
  )

  const res = await list(p1.token)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body.map((o: any) => o.id), [delivery.id, first.id, older.id])
  const order = res.body[0]
  assert.deepEqual(Object.keys(order).sort(), [
    'address', 'buyer', 'createdAt', 'fulfilment', 'id', 'items', 'status', 'total', 'updatedAt',
  ])
  assert.equal(order.status, 'pending')
  assert.equal(order.fulfilment, 'delivery')
  assert.deepEqual(order.address, { line1: 'Rua das Flores 1', city: 'Viana do Castelo', postalCode: '4900-001' })
  assert.deepEqual(order.buyer, { id: b.id, name: 'List Buyer', email: b.email })
  assert.deepEqual(order.items, [{ productId: cheese, name: 'Cheese', price: 4.5, quantity: 2, unit: 'wheel' }])
  assert.equal(order.total, 9)
  assert.ok(!Number.isNaN(Date.parse(order.createdAt)))
  assert.ok(!Number.isNaN(Date.parse(order.updatedAt)))
  assert.equal(res.body[1].total, 4.5)
  assert.deepEqual(res.body[1].items.map((i: any) => i.productId), [apples])
  assert.equal(res.body[2].address, null)
  assert.equal(res.body[2].fulfilment, 'pickup')

  const other = await list(p2.token)
  assert.equal(other.status, 200)
  assert.equal(other.body.length, 1)
  assert.equal(other.body[0].id, p2Order.id)
  assert.equal(other.body[0].total, 7.1)
  assert.deepEqual(other.body[0].items.map((i: any) => i.productId), [honey])
  assert.deepEqual((await list(p3.token)).body, [])

  const raw = JSON.stringify(res.body)
  for (const leaked of ['passwordHash', 'password', 'card', '_id', 'phone', 'rejectReason']) assert.ok(!raw.includes(leaked), leaked)
})

test('PATCH moves an order one step at a time and records one history entry per change', async () => {
  const b = await buyer('Step Buyer')
  const p = await producer('Step Farm')
  const id = await product(p.id, { stock: 10 })
  const order = await placeOrder(b.token, [{ productId: id, quantity: 1 }])

  for (const status of ['confirmed', 'ready', 'delivered']) {
    const res = await setStatus(p.token, order.id, status)
    assert.equal(res.status, 200)
    assert.equal(res.body.id, order.id)
    assert.equal(res.body.status, status)
    assert.deepEqual(Object.keys(res.body).sort(), [
      'address', 'buyer', 'createdAt', 'fulfilment', 'id', 'items', 'status', 'total', 'updatedAt',
    ])
  }

  const doc = await OrderModel.findById(order.id).lean()
  assert.equal(doc!.status, 'delivered')
  assert.deepEqual(doc!.history.map((h) => h.status), ['pending', 'confirmed', 'ready', 'delivered'])
  assert.equal((await list(p.token)).body[0].status, 'delivered')
})

test('invalid transitions: skipping, going backwards, repeating and cancelling after pending all 400 and change nothing', async () => {
  const b = await buyer('Transition Buyer')
  const p = await producer('Transition Farm')
  const id = await product(p.id, { stock: 10 })
  const order = await placeOrder(b.token, [{ productId: id, quantity: 2 }])

  const unchanged = async () => {
    const doc = await OrderModel.findById(order.id).lean()
    assert.equal(doc!.status, 'pending')
    assert.deepEqual(doc!.history.map((h) => h.status), ['pending'])
    assert.equal(await stockOf(id), 8)
  }

  for (const status of ['ready', 'delivered', 'pending']) {
    const res = await setStatus(p.token, order.id, status)
    assert.equal(res.status, 400, status)
    assert.equal(res.body.error.code, 'INVALID_STATUS_TRANSITION')
    await unchanged()
  }

  assert.equal((await setStatus(p.token, order.id, 'confirmed')).status, 200)
  for (const status of ['confirmed', 'pending', 'cancelled']) {
    const res = await setStatus(p.token, order.id, status)
    assert.equal(res.status, 400, status)
    assert.equal(res.body.error.code, 'INVALID_STATUS_TRANSITION')
  }
  const doc = await OrderModel.findById(order.id).lean()
  assert.equal(doc!.status, 'confirmed')
  assert.deepEqual(doc!.history.map((h) => h.status), ['pending', 'confirmed'])
  assert.equal(await stockOf(id), 8)
})

test('PATCH validates its body before doing anything', async () => {
  const b = await buyer('Body Buyer')
  const p = await producer('Body Farm')
  const id = await product(p.id, { stock: 10 })
  const order = await placeOrder(b.token, [{ productId: id, quantity: 1 }])

  for (const body of [{}, { status: 'shipped' }, { status: 1 }, { status: null }]) {
    const res = await call(`/api/orders/${order.id}/status`, 'PATCH', p.token, body)
    assert.equal(res.status, 400, JSON.stringify(body))
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    assert.ok(res.body.error.fields.status)
  }
  const notAnObject = await call(`/api/orders/${order.id}/status`, 'PATCH', p.token, 'nope')
  assert.equal(notAnObject.status, 400)
  assert.equal(notAnObject.body.error.code, 'VALIDATION_ERROR')
  assert.equal((await OrderModel.findById(order.id).lean())!.status, 'pending')
})

test('ownership: another producer 403, unknown and malformed ids 404, and nothing changes', async () => {
  const b = await buyer('Owner Buyer')
  const owner = await producer('Owner Farm')
  const other = await producer('Other Farm')
  const id = await product(owner.id, { stock: 10 })
  const order = await placeOrder(b.token, [{ productId: id, quantity: 2 }])

  const forbidden = await setStatus(other.token, order.id, 'confirmed')
  assert.equal(forbidden.status, 403)
  assert.equal(forbidden.body.error.code, 'FORBIDDEN')
  assert.equal((await OrderModel.findById(order.id).lean())!.status, 'pending')
  assert.equal(await stockOf(id), 8)

  for (const unknown of [String(new mongoose.Types.ObjectId()), 'not-an-id', 'f'.repeat(24)]) {
    const res = await setStatus(owner.token, unknown, 'confirmed')
    assert.equal(res.status, 404, unknown)
    assert.equal(res.body.error.code, 'ORDER_NOT_FOUND')
  }
})

test('two parallel confirmed requests: one 200, one 400, and exactly one new history entry', async () => {
  const b = await buyer('Race Buyer')
  const p = await producer('Race Farm')
  const id = await product(p.id, { stock: 10 })
  const order = await placeOrder(b.token, [{ productId: id, quantity: 1 }])

  const [r1, r2] = await Promise.all([setStatus(p.token, order.id, 'confirmed'), setStatus(p.token, order.id, 'confirmed')])
  assert.deepEqual([r1.status, r2.status].sort(), [200, 400])
  const failed = r1.status === 400 ? r1 : r2
  assert.equal(failed.body.error.code, 'INVALID_STATUS_TRANSITION')

  const doc = await OrderModel.findById(order.id).lean()
  assert.equal(doc!.status, 'confirmed')
  assert.deepEqual(doc!.history.map((h) => h.status), ['pending', 'confirmed'])
  assert.equal(doc!.history.filter((h) => h.status === 'confirmed').length, 1)
})

test('cancelling restores stock, updates both sockets and notifies the buyer', async () => {
  const b = await buyer('Cancel Buyer')
  const p = await producer('Cancel Farm')
  const id = await product(p.id, { stock: 10 })
  const order = await placeOrder(b.token, [{ productId: id, quantity: 3 }])
  assert.equal(await stockOf(id), 7)

  const buyerSocket = await openSocket(b.token)
  const producerSocket = await openSocket(p.token)
  try {
    const buyerEvent = new Promise<any>((resolve) => buyerSocket.once('order-updated', resolve))
    const producerEvent = new Promise<any>((resolve) => producerSocket.once('order-updated', resolve))
    const res = await setStatus(p.token, order.id, 'cancelled')
    assert.equal(res.status, 200)
    assert.equal(res.body.status, 'cancelled')

    const [forBuyer, forProducer] = await Promise.all([
      Promise.race([buyerEvent, new Promise((_, reject) => setTimeout(() => reject(new Error('no buyer order-updated')), 2000))]),
      Promise.race([producerEvent, new Promise((_, reject) => setTimeout(() => reject(new Error('no producer order-updated')), 2000))]),
    ])
    for (const event of [forBuyer, forProducer]) {
      assert.deepEqual(Object.keys(event).sort(), ['orderId', 'status', 'updatedAt'])
      assert.equal(event.orderId, order.id)
      assert.equal(event.status, 'cancelled')
      assert.ok(!Number.isNaN(Date.parse(event.updatedAt)))
    }

    const note = await NotificationModel.findOne({ user: b.id, type: 'order-status-changed' }).lean()
    assert.ok(note)
    assert.ok(note!.text.toLowerCase().includes('cancelled'))
  } finally {
    buyerSocket.close()
    producerSocket.close()
  }

  assert.equal(await stockOf(id), 10)
  const doc = await OrderModel.findById(order.id).lean()
  assert.deepEqual(doc!.history.map((h) => h.status), ['pending', 'cancelled'])
  assert.equal((await list(p.token)).body[0].status, 'cancelled')

  const again = await setStatus(p.token, order.id, 'cancelled')
  assert.equal(again.status, 400)
  assert.equal(again.body.error.code, 'INVALID_STATUS_TRANSITION')
  assert.equal(await stockOf(id), 10)
})

test('cancelling skips products that no longer exist and restores auction lot quantities', async () => {
  const b = await buyer('Missing Buyer')
  const p = await producer('Missing Farm')
  const gone = await product(p.id, { stock: 10 })
  const kept = await product(p.id, { stock: 10 })
  const order = await placeOrder(b.token, [{ productId: gone, quantity: 2 }, { productId: kept, quantity: 3 }])
  await ProductModel.deleteOne({ _id: gone })

  const res = await setStatus(p.token, order.id, 'cancelled')
  assert.equal(res.status, 200)
  assert.equal(await stockOf(kept), 10)
  assert.equal(await ProductModel.countDocuments({ _id: gone }), 0)

  const lot = await product(p.id, { stock: 2, name: 'Auction lot', unit: 'kg' })
  const auctionOrder = await createOrder({
    buyer: b.id,
    producer: p.id,
    items: [{ productId: lot, name: 'Auction lot', price: 12.5, quantity: 3, unit: 'kg' }],
    fulfilment: 'pickup',
    auction: new mongoose.Types.ObjectId().toString(),
  })
  const cancelled = await setStatus(p.token, String(auctionOrder._id), 'cancelled')
  assert.equal(cancelled.status, 200)
  assert.equal(await stockOf(lot), 5)
})
