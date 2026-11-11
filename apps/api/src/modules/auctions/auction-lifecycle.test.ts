import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { after, before, beforeEach, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { Server as IoServer } from 'socket.io'
import { io as connectClient } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { attach } from '../../realtime/socket.js'
import { NotificationModel } from '../notifications/notifications.model.js'
import { OrderModel } from '../orders/orders.model.js'
import { ProductModel } from '../products/products.model.js'
import { UserModel, type CardEmbedded, type ProducerEmbedded, type UserRole } from '../users/users.model.js'
import { tick } from './auction-lifecycle.js'
import { AuctionModel, type AuctionStatus } from './auctions.model.js'
import { BidModel } from './bids.model.js'

let socketHttp: Server
let ioServer: IoServer
let socketUrl = ''
let counter = 0
const open: Socket[] = []

const minute = 60_000
const validCard: CardEmbedded = { last4: '4242', holder: 'Test Buyer', expiry: '12/99', simulateInvalid: false }
const invalidCard: CardEmbedded = { last4: '0000', holder: 'Test Buyer', expiry: '12/99', simulateInvalid: true }

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  await Promise.all([
    UserModel.syncIndexes(),
    ProductModel.syncIndexes(),
    AuctionModel.syncIndexes(),
    BidModel.syncIndexes(),
    OrderModel.syncIndexes(),
    NotificationModel.syncIndexes(),
  ])
  socketHttp = createServer()
  ioServer = new IoServer(socketHttp)
  attach(ioServer)
  await new Promise<void>((resolve) => socketHttp.listen(0, resolve))
  const address = socketHttp.address()
  if (!address || typeof address !== 'object') throw new Error('no socket port')
  socketUrl = `http://127.0.0.1:${address.port}`
})

after(async () => {
  for (const socket of open) socket.close()
  await ioServer.close()
  await new Promise<void>((resolve) => socketHttp.close(() => resolve()))
  await disconnect()
})

beforeEach(async () => {
  await Promise.all([
    NotificationModel.deleteMany({}),
    OrderModel.deleteMany({}),
    BidModel.deleteMany({}),
    AuctionModel.deleteMany({}),
    ProductModel.deleteMany({}),
    UserModel.deleteMany({}),
  ])
})

async function createUser(role: UserRole, name: string, card: CardEmbedded | null = null, producer?: Partial<ProducerEmbedded>) {
  counter += 1
  const email = `lc${counter}@example.com`
  const doc = await UserModel.create({
    name,
    email,
    passwordHash: 'x',
    role,
    ...(card ? { card } : {}),
    ...(producer ? { producer: { farmName: name, ...producer } } : {}),
  })
  const id = String(doc._id)
  return { id, name, email, token: jwt.sign({ sub: id, role }, env.jwtSecret, { expiresIn: '1h', algorithm: 'HS256' }) }
}

const buyer = (name: string, card: CardEmbedded | null) => createUser('buyer', name, card)
const producer = (name: string) => createUser('producer', name, null, { status: 'approved', location: 'Douro, Portugal' })

async function product(producerId: string, stock = 100): Promise<string> {
  counter += 1
  const doc = await ProductModel.create({
    producer: producerId,
    name: `Lifecycle product ${counter}`,
    category: 'fruit',
    price: 2,
    unit: 'kg',
    stock,
    season: 'summer',
    organic: false,
  })
  return String(doc._id)
}

const stockOf = async (productId: string): Promise<number> => (await ProductModel.findById(productId).lean())!.stock

async function seedAuction(producerId: string, productId: string, over: Record<string, unknown> = {}): Promise<string> {
  const now = Date.now()
  const doc = await AuctionModel.create({
    producer: producerId,
    product: productId,
    productName: 'Kiwi lot',
    category: 'fruit',
    unit: 'kg',
    quantity: 10,
    basePrice: 5,
    increment: 1,
    durationMinutes: 30,
    startsAt: new Date(now - 20 * minute),
    endsAt: new Date(now - minute),
    status: 'active' as AuctionStatus,
    cancelled: false,
    currentPrice: 5,
    bidCount: 0,
    leader: null,
    winner: null,
    lastViewers: 0,
    ...over,
  })
  return String(doc._id)
}

async function seedBid(auctionId: string, bidder: { id: string, name: string }, amount: number): Promise<void> {
  await BidModel.create({ auction: auctionId, bidder: bidder.id, name: bidder.name, amount })
}

function client(token?: string): Promise<Socket> {
  const socket = connectClient(socketUrl, {
    auth: token === undefined ? {} : { token },
    forceNew: true,
    reconnection: false,
  })
  open.push(socket)
  return new Promise((resolve, reject) => {
    socket.once('connect', () => resolve(socket))
    socket.once('connect_error', reject)
  })
}

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

function collect(socket: Socket, event: string): any[] {
  const got: any[] = []
  socket.on(event, (payload) => got.push(payload))
  return got
}

test('tick starts a scheduled auction at startsAt and closes one whose whole window has already passed', async () => {
  const p = await producer('Start farm')
  const item = await product(p.id)
  const now = Date.now()
  const due = await seedAuction(p.id, item, {
    status: 'scheduled',
    startsAt: new Date(now - 2_000),
    endsAt: new Date(now + 10 * minute),
  })
  const future = await seedAuction(p.id, item, {
    status: 'scheduled',
    startsAt: new Date(now + minute),
    endsAt: new Date(now + 31 * minute),
  })
  const missed = await seedAuction(p.id, item, {
    status: 'scheduled',
    startsAt: new Date(now - 20 * minute),
    endsAt: new Date(now - 10 * minute),
  })

  await tick(new Date(now))

  const dueDoc = await AuctionModel.findById(due).lean()
  assert.equal(dueDoc!.status, 'active')
  assert.equal(dueDoc!.settledAt ?? null, null)
  const futureDoc = await AuctionModel.findById(future).lean()
  assert.equal(futureDoc!.status, 'scheduled')
  const missedDoc = await AuctionModel.findById(missed).lean()
  assert.equal(missedDoc!.status, 'ended')
  assert.equal(missedDoc!.winner, null)
  assert.ok(missedDoc!.settledAt)
  assert.equal((await stockOf(item)), 100)
  assert.equal(await OrderModel.countDocuments(), 0)
})

test('winning cascade: invalid top card is skipped, the next bidder wins, one pickup order at their bid', async () => {
  const p = await producer('Cascade farm')
  const invalid = await buyer('Invalid top', invalidCard)
  const winner = await buyer('Valid second', validCard)
  const item = await product(p.id, 100)
  const auctionId = await seedAuction(p.id, item, {
    quantity: 10,
    currentPrice: 20,
    bidCount: 2,
    leader: { id: invalid.id, name: invalid.name },
  })
  await seedBid(auctionId, invalid, 12)
  await seedBid(auctionId, invalid, 20)
  await seedBid(auctionId, winner, 15)

  const room = await client()
  const roomEnded = collect(room, 'auction-ended')
  room.emit('join', { room: `auction:${auctionId}` })
  const outsiderSocket = await client()
  const outsiderEnded = collect(outsiderSocket, 'auction-ended')
  const invalidSocket = await client(invalid.token)
  const invalidNotes = collect(invalidSocket, 'notification')
  const winnerSocket = await client(winner.token)
  const winnerNotes = collect(winnerSocket, 'notification')
  const producerSocket = await client(p.token)
  const producerNotes = collect(producerSocket, 'notification')
  const producerOrders = collect(producerSocket, 'order-created')
  await wait(150)

  await tick(new Date())
  await wait(250)

  const doc = await AuctionModel.findById(auctionId).lean()
  assert.equal(doc!.status, 'ended')
  assert.equal(doc!.settledAt instanceof Date, true)
  assert.equal(doc!.winner!.id.toString(), winner.id)
  assert.equal(doc!.winner!.name, winner.name)
  assert.equal(doc!.lastViewers, 1)
  assert.equal(await stockOf(item), 90)

  const orders = await OrderModel.find().lean()
  assert.equal(orders.length, 1)
  const order = orders[0]!
  assert.equal(String(order.buyer), winner.id)
  assert.equal(String(order.producer), p.id)
  assert.equal(String(order.auction), auctionId)
  assert.equal(order.status, 'pending')
  assert.equal(order.fulfilment, 'pickup')
  assert.equal(order.address, null)
  assert.equal(order.total, 15)
  assert.equal(order.items.length, 1)
  assert.equal(String(order.items[0]!.productId), item)
  assert.equal(order.items[0]!.name, 'Kiwi lot')
  assert.equal(order.items[0]!.price, 1.5)
  assert.equal(order.items[0]!.quantity, 10)
  assert.equal(order.items[0]!.unit, 'kg')
  assert.deepEqual(order.history.map((h) => h.status), ['pending'])

  const skipped = await NotificationModel.find({ user: invalid.id }).lean()
  assert.equal(skipped.length, 1)
  assert.equal(skipped[0]!.type, 'auction-skipped')
  const won = await NotificationModel.find({ user: winner.id }).lean()
  assert.equal(won.length, 1)
  assert.equal(won[0]!.type, 'auction-won')
  const producerNew = await NotificationModel.find({ user: p.id, type: 'order-new' }).lean()
  assert.equal(producerNew.length, 1)

  assert.equal(invalidNotes.length, 1)
  assert.equal(invalidNotes[0].type, 'auction-skipped')
  assert.equal(winnerNotes.length, 1)
  assert.equal(winnerNotes[0].type, 'auction-won')
  assert.equal(producerNotes.length, 1)
  assert.equal(producerNotes[0].type, 'order-new')

  assert.equal(roomEnded.length, 1)
  assert.deepEqual(roomEnded[0], {
    auctionId,
    status: 'ended',
    winner: { id: winner.id, name: winner.name },
    currentPrice: 20,
  })
  assert.deepEqual(outsiderEnded, [])

  assert.equal(producerOrders.length, 1)
  const event = producerOrders[0]
  assert.equal(event.id, String(order._id))
  assert.equal(event.status, 'pending')
  assert.equal(event.total, 15)
  assert.equal(event.fulfilment, 'pickup')
  assert.equal(event.address, null)
  assert.deepEqual(event.buyer, { id: winner.id, name: winner.name, email: winner.email })
  assert.deepEqual(event.items, [{
    productId: item,
    name: 'Kiwi lot',
    price: 1.5,
    quantity: 10,
    unit: 'kg',
  }])
  assert.ok(!Number.isNaN(Date.parse(event.createdAt)))
  assert.ok(!Number.isNaN(Date.parse(event.updatedAt)))
})

test('all cards fail or no bids: no order, stock untouched, auction-ended with winner null', async () => {
  const p = await producer('Nobody farm')
  const invalid = await buyer('No card top', invalidCard)
  const noCard = await buyer('No card second', null)
  const failingProduct = await product(p.id, 40)
  const emptyProduct = await product(p.id, 30)
  const failingId = await seedAuction(p.id, failingProduct, {
    quantity: 10,
    currentPrice: 9,
    bidCount: 2,
    leader: { id: invalid.id, name: invalid.name },
  })
  const emptyId = await seedAuction(p.id, emptyProduct, { quantity: 10, basePrice: 7, currentPrice: 7 })
  await seedBid(failingId, invalid, 9)
  await seedBid(failingId, noCard, 8)

  const failingRoom = await client()
  const failingEnded = collect(failingRoom, 'auction-ended')
  failingRoom.emit('join', { room: `auction:${failingId}` })
  const emptyRoom = await client()
  const emptyEnded = collect(emptyRoom, 'auction-ended')
  emptyRoom.emit('join', { room: `auction:${emptyId}` })
  await wait(150)

  await tick(new Date())
  await wait(250)

  assert.equal(await OrderModel.countDocuments(), 0)
  assert.equal(await stockOf(failingProduct), 40)
  assert.equal(await stockOf(emptyProduct), 30)

  const failingDoc = await AuctionModel.findById(failingId).lean()
  assert.equal(failingDoc!.status, 'ended')
  assert.equal(failingDoc!.winner, null)
  assert.ok(failingDoc!.settledAt)
  const emptyDoc = await AuctionModel.findById(emptyId).lean()
  assert.equal(emptyDoc!.status, 'ended')
  assert.equal(emptyDoc!.winner, null)
  assert.ok(emptyDoc!.settledAt)

  assert.equal(await NotificationModel.countDocuments({ user: invalid.id, type: 'auction-skipped' }), 1)
  assert.equal(await NotificationModel.countDocuments({ user: noCard.id, type: 'auction-skipped' }), 1)
  assert.equal(await NotificationModel.countDocuments({ type: 'auction-won' }), 0)
  assert.equal(await NotificationModel.countDocuments({ user: p.id, type: 'order-new' }), 0)

  assert.deepEqual(failingEnded[0], {
    auctionId: failingId,
    status: 'ended',
    winner: null,
    currentPrice: 9,
  })
  assert.deepEqual(emptyEnded[0], {
    auctionId: emptyId,
    status: 'ended',
    winner: null,
    currentPrice: 7,
  })
})

test('stock edge: a payable bidder still loses when the lot quantity is no longer in stock', async () => {
  const p = await producer('Scarce farm')
  const bidder = await buyer('Payable bidder', validCard)
  const item = await product(p.id, 5)
  const auctionId = await seedAuction(p.id, item, { quantity: 10, currentPrice: 14, bidCount: 1, leader: { id: bidder.id, name: bidder.name } })
  await seedBid(auctionId, bidder, 14)
  const room = await client()
  const ended = collect(room, 'auction-ended')
  room.emit('join', { room: `auction:${auctionId}` })
  await wait(150)

  await tick(new Date())
  await wait(250)

  assert.equal(await OrderModel.countDocuments(), 0)
  assert.equal(await stockOf(item), 5)
  const doc = await AuctionModel.findById(auctionId).lean()
  assert.equal(doc!.status, 'ended')
  assert.equal(doc!.winner, null)
  assert.ok(doc!.settledAt)
  assert.equal(await NotificationModel.countDocuments({ user: bidder.id, type: 'auction-skipped' }), 1)
  assert.equal(await NotificationModel.countDocuments({ user: bidder.id, type: 'auction-won' }), 0)
  assert.deepEqual(ended[0], {
    auctionId,
    status: 'ended',
    winner: null,
    currentPrice: 14,
  })
})

test('recovery adopts an order already created for a stranded auction instead of charging and decrementing again', async () => {
  const p = await producer('Crash farm')
  const bidder = await buyer('Crash winner', validCard)
  const item = await product(p.id, 16)
  const auctionId = await seedAuction(p.id, item, {
    status: 'ended',
    quantity: 4,
    currentPrice: 12,
    bidCount: 1,
    leader: { id: bidder.id, name: bidder.name },
  })
  await seedBid(auctionId, bidder, 12)
  // Simulates the crash window: the order and the stock change happened, but
  // the winner write and settledAt did not.
  await OrderModel.create({
    buyer: bidder.id,
    producer: p.id,
    items: [{ productId: item, name: 'Kiwi lot', price: 3, quantity: 4, unit: 'kg' }],
    total: 12,
    status: 'pending',
    history: [{ status: 'pending', date: new Date() }],
    fulfilment: 'pickup',
    address: null,
    auction: auctionId,
  })
  await AuctionModel.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(auctionId) },
    { $set: { updatedAt: new Date(Date.now() - 20_000) } },
  )

  await tick(new Date())

  assert.equal(await OrderModel.countDocuments({ auction: auctionId }), 1)
  assert.equal(await stockOf(item), 16)
  assert.equal(await NotificationModel.countDocuments({ user: bidder.id, type: 'auction-won' }), 0)
  assert.equal(await NotificationModel.countDocuments({ user: p.id, type: 'order-new' }), 0)
  const doc = await AuctionModel.findById(auctionId).lean()
  assert.equal(doc!.winner!.id.toString(), bidder.id)
  assert.ok(doc!.settledAt)
})

test('two ticks in parallel on a due auction create one order and settle it once', async () => {
  const p = await producer('Race close farm')
  const bidder = await buyer('Race winner', validCard)
  const item = await product(p.id, 100)
  const auctionId = await seedAuction(p.id, item, { currentPrice: 20, bidCount: 1, leader: { id: bidder.id, name: bidder.name } })
  await seedBid(auctionId, bidder, 20)

  await Promise.all([tick(new Date()), tick(new Date())])

  assert.equal(await OrderModel.countDocuments({ auction: auctionId }), 1)
  assert.equal(await stockOf(item), 90)
  assert.equal(await NotificationModel.countDocuments({ user: bidder.id, type: 'auction-won' }), 1)
  assert.equal(await NotificationModel.countDocuments({ user: p.id, type: 'order-new' }), 1)
  const doc = await AuctionModel.findById(auctionId).lean()
  assert.equal(doc!.status, 'ended')
  assert.equal(doc!.winner!.id.toString(), bidder.id)
  assert.ok(doc!.settledAt)

  await tick(new Date(Date.now() + minute))
  assert.equal(await OrderModel.countDocuments({ auction: auctionId }), 1)
  assert.equal(await stockOf(item), 90)
  assert.equal(await NotificationModel.countDocuments({ user: bidder.id, type: 'auction-won' }), 1)
})

test('recovery settles an ended auction stranded without settledAt only after 10 s', async () => {
  const p = await producer('Recovery farm')
  const staleBidder = await buyer('Stale bidder', validCard)
  const freshBidder = await buyer('Fresh bidder', validCard)
  const staleProduct = await product(p.id, 20)
  const freshProduct = await product(p.id, 20)
  const staleId = await seedAuction(p.id, staleProduct, {
    status: 'ended',
    quantity: 4,
    currentPrice: 12,
    bidCount: 1,
    leader: { id: staleBidder.id, name: staleBidder.name },
  })
  const freshId = await seedAuction(p.id, freshProduct, {
    status: 'ended',
    quantity: 4,
    currentPrice: 8,
    bidCount: 1,
    leader: { id: freshBidder.id, name: freshBidder.name },
  })
  await seedBid(staleId, staleBidder, 12)
  await seedBid(freshId, freshBidder, 8)
  await AuctionModel.collection.updateOne(
    { _id: new mongoose.Types.ObjectId(staleId) },
    { $set: { updatedAt: new Date(Date.now() - 20_000) } },
  )

  await tick(new Date())

  const staleOrder = await OrderModel.findOne({ auction: staleId }).lean()
  assert.ok(staleOrder)
  assert.equal(staleOrder!.total, 12)
  assert.equal(await stockOf(staleProduct), 16)
  const staleDoc = await AuctionModel.findById(staleId).lean()
  assert.equal(staleDoc!.winner!.id.toString(), staleBidder.id)
  assert.ok(staleDoc!.settledAt)

  assert.equal(await OrderModel.countDocuments({ auction: freshId }), 0)
  assert.equal(await stockOf(freshProduct), 20)
  const freshDoc = await AuctionModel.findById(freshId).lean()
  assert.equal(freshDoc!.winner, null)
  assert.equal(freshDoc!.settledAt ?? null, null)

  await tick(new Date(Date.now() + 11_000))

  const freshOrder = await OrderModel.findOne({ auction: freshId }).lean()
  assert.ok(freshOrder)
  assert.equal(freshOrder!.total, 8)
  assert.equal(await stockOf(freshProduct), 16)
  const settledFresh = await AuctionModel.findById(freshId).lean()
  assert.equal(settledFresh!.winner!.id.toString(), freshBidder.id)
  assert.ok(settledFresh!.settledAt)
  assert.equal(await OrderModel.countDocuments({ auction: staleId }), 1)
})
