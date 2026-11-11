import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { Server as IoServer } from 'socket.io'
import { io as connectClient } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { attach } from '../../realtime/socket.js'
import { ProductModel } from '../products/products.model.js'
import { UserModel, type ProducerEmbedded, type UserRole } from '../users/users.model.js'
import { AuctionModel, type AuctionStatus } from './auctions.model.js'
import { BidModel } from './bids.model.js'

let server: Server
let baseUrl = ''
let socketHttp: Server
let ioServer: IoServer
let socketUrl = ''
let counter = 0
let productCounter = 0
const open: Socket[] = []

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  await Promise.all([
    UserModel.syncIndexes(),
    ProductModel.syncIndexes(),
    AuctionModel.syncIndexes(),
    BidModel.syncIndexes(),
  ])
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const address = server.address()
  if (!address || typeof address !== 'object') throw new Error('no port')
  baseUrl = `http://127.0.0.1:${address.port}`
  socketHttp = createServer()
  ioServer = new IoServer(socketHttp)
  attach(ioServer)
  await new Promise<void>((r) => socketHttp.listen(0, r))
  const socketAddress = socketHttp.address()
  if (!socketAddress || typeof socketAddress !== 'object') throw new Error('no socket port')
  socketUrl = `http://127.0.0.1:${socketAddress.port}`
})

after(async () => {
  for (const s of open) s.close()
  await ioServer.close()
  await new Promise<void>((resolve) => server.close(() => resolve()))
  await disconnect()
})

async function createUser(role: UserRole, name: string, producer?: Partial<ProducerEmbedded>) {
  counter += 1
  const doc = await UserModel.create({
    name,
    email: `b${counter}@example.com`,
    passwordHash: 'x',
    role,
    ...(producer ? { producer: { farmName: name, ...producer } } : {}),
  })
  const id = String(doc._id)
  return { id, name, token: jwt.sign({ sub: id, role }, env.jwtSecret, { expiresIn: '1h', algorithm: 'HS256' }) }
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
  const text = await res.text()
  return { status: res.status, location: res.headers.get('location'), body: (text ? JSON.parse(text) : null) as any }
}

const buyer = (name: string) => createUser('buyer', name)
const producer = (name: string, extra: Partial<ProducerEmbedded> = {}) =>
  createUser('producer', name, { status: 'approved', location: 'Douro, Portugal', ...extra })

async function product(producerId: string, over: Record<string, unknown> = {}) {
  productCounter += 1
  const doc = await ProductModel.create({
    producer: producerId,
    name: `Bid product ${productCounter}`,
    category: 'fruit',
    price: 2,
    unit: 'kg',
    stock: 100,
    season: 'summer',
    organic: false,
    ...over,
  })
  return String(doc._id)
}

const minute = 60_000

async function seedAuction(producerId: string, over: Record<string, unknown> = {}) {
  const item = await product(producerId)
  const now = Date.now()
  const startsAt = new Date((over.startsAt as Date | undefined) ?? now - 10 * minute)
  const endsAt = new Date((over.endsAt as Date | undefined) ?? now + 20 * minute)
  const doc = await AuctionModel.create({
    producer: producerId,
    product: item,
    productName: `Seeded lot ${productCounter}`,
    category: 'fruit',
    unit: 'kg',
    quantity: 10,
    basePrice: 5,
    increment: 1,
    durationMinutes: 30,
    startsAt,
    endsAt,
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

const bid = (token: string | undefined, auctionId: string, body: unknown) =>
  call(`/api/auctions/${auctionId}/bids`, 'POST', token, body)

const auctionState = async (id: string) => {
  const doc = await AuctionModel.findById(id).lean()
  return {
    currentPrice: doc!.currentPrice,
    bidCount: doc!.bidCount,
    leader: doc!.leader ? { id: String(doc!.leader.id), name: doc!.leader.name } : null,
  }
}

function client(token?: string): Promise<Socket> {
  const s = connectClient(socketUrl, {
    auth: token === undefined ? {} : { token },
    forceNew: true,
    reconnection: false,
  })
  open.push(s)
  return new Promise((resolve, reject) => {
    s.once('connect', () => resolve(s))
    s.once('connect_error', reject)
  })
}

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

function collect(s: Socket, event: string): any[] {
  const got: any[] = []
  s.on(event, (p) => got.push(p))
  return got
}

test('bids: visitor 401, admin and foreign producer 403, own lot 403 OWN_LOT, missing auction 404', async () => {
  const p = await producer('Lot Farm')
  const other = await producer('Other Farm')
  const admin = await createUser('admin', 'Bid Admin')
  const b = await buyer('Auth Bidder')
  const id = await seedAuction(p.id)

  const noToken = await bid(undefined, id, { amount: 6 })
  assert.equal(noToken.status, 401)
  assert.equal(noToken.body.error.code, 'UNAUTHORIZED')

  const asAdmin = await bid(admin.token, id, { amount: 6 })
  assert.equal(asAdmin.status, 403)
  assert.equal(asAdmin.body.error.code, 'FORBIDDEN')

  const asForeignProducer = await bid(other.token, id, { amount: 6 })
  assert.equal(asForeignProducer.status, 403)
  assert.equal(asForeignProducer.body.error.code, 'FORBIDDEN')

  const asOwner = await bid(p.token, id, { amount: 6 })
  assert.equal(asOwner.status, 403)
  assert.equal(asOwner.body.error.code, 'OWN_LOT')

  for (const missing of [String(new mongoose.Types.ObjectId()), 'not-an-id']) {
    const res = await bid(b.token, missing, { amount: 6 })
    assert.equal(res.status, 404, missing)
    assert.equal(res.body.error.code, 'AUCTION_NOT_FOUND')
  }

  assert.deepEqual(await auctionState(id), { currentPrice: 5, bidCount: 0, leader: null })
  assert.equal(await BidModel.countDocuments({ auction: id }), 0)
})

test('bid validation: amount required, numeric, positive, capped and rounded to cents', async () => {
  const p = await producer('Validate Farm')
  const id = await seedAuction(p.id)
  const cases: { body: unknown, field?: string }[] = [
    { body: {} },
    { body: { amount: '6' } },
    { body: { amount: null } },
    { body: { amount: 0 } },
    { body: { amount: -1 } },
    { body: { amount: 0.001 } },
    { body: { amount: 1_000_000.01 } },
  ]

  let n = 0
  for (const item of cases) {
    n += 1
    const b = await buyer(`Invalid bidder ${n}`)
    const res = await bid(b.token, id, item.body)
    assert.equal(res.status, 400, JSON.stringify(item.body))
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    assert.ok(res.body.error.fields.amount, JSON.stringify(res.body))
  }

  const b = await buyer('Non object bidder')
  const notObject = await bid(b.token, id, 'nope')
  assert.equal(notObject.status, 400)
  assert.equal(notObject.body.error.code, 'VALIDATION_ERROR')

  assert.deepEqual(await auctionState(id), { currentPrice: 5, bidCount: 0, leader: null })
  assert.equal(await BidModel.countDocuments({ auction: id }), 0)
})

test('a winning bid: 201 AuctionBid mapped from the token, atomic state, room events only', async () => {
  const p = await producer('Event Farm')
  const b1 = await buyer('Event Winner')
  const b2 = await buyer('Event Observer')
  const b3 = await buyer('Rounding Bidder')
  const id = await seedAuction(p.id)

  const room = await client()
  const roomBidPlaced = collect(room, 'bid-placed')
  const roomUpdated = collect(room, 'auction-updated')
  room.emit('join', { room: `auction:${id}` })
  const observer = await client(b2.token)
  const observerBidPlaced = collect(observer, 'bid-placed')
  const observerRejected = collect(observer, 'bid-rejected')
  await wait(100)

  const res = await bid(b1.token, id, {
    amount: 6,
    bidderId: p.id,
    name: 'Injected Bidder',
    currentPrice: 1,
    leader: { id: p.id, name: 'Injected' },
  })
  assert.equal(res.status, 201)
  assert.equal(res.location, `/api/auctions/${id}/bids/${res.body.id}`)
  assert.deepEqual(Object.keys(res.body).sort(), ['amount', 'bidderId', 'date', 'id', 'name'])
  assert.equal(res.body.amount, 6)
  assert.equal(res.body.bidderId, b1.id)
  assert.equal(res.body.name, b1.name)
  assert.ok(!Number.isNaN(Date.parse(res.body.date)))
  const raw = JSON.stringify(res.body)
  for (const leaked of ['"_id"', 'passwordHash', 'email', 'currentPrice', 'auction']) {
    assert.ok(!raw.includes(leaked), leaked)
  }

  const endsAt = new Date((await AuctionModel.findById(id).lean())!.endsAt).toISOString()
  const leader = { id: b1.id, name: b1.name }
  await wait(200)
  assert.equal(roomBidPlaced.length, 1)
  assert.deepEqual(roomBidPlaced[0], {
    auctionId: id,
    bid: res.body,
    currentPrice: 6,
    leader,
    endsAt,
  })
  assert.equal(roomUpdated.length, 1)
  assert.deepEqual(roomUpdated[0], {
    auctionId: id,
    currentPrice: 6,
    bidCount: 1,
    leader,
    endsAt,
    status: 'active',
  })
  assert.deepEqual(observerBidPlaced, [])
  assert.deepEqual(observerRejected, [])

  assert.deepEqual(await auctionState(id), { currentPrice: 6, bidCount: 1, leader: { id: b1.id, name: b1.name } })
  const docs = await BidModel.find({ auction: id }).lean()
  assert.equal(docs.length, 1)
  assert.equal(String(docs[0].bidder), b1.id)
  assert.equal(docs[0].name, b1.name)
  assert.equal(docs[0].amount, 6)
  assert.equal(String(docs[0]._id), res.body.id)

  const rounded = await bid(b3.token, id, { amount: 7.126 })
  assert.equal(rounded.status, 201)
  assert.equal(rounded.body.amount, 7.13)
  assert.equal(rounded.body.bidderId, b3.id)
  assert.deepEqual(await auctionState(id), { currentPrice: 7.13, bidCount: 2, leader: { id: b3.id, name: b3.name } })
  await wait(200)
  assert.equal(roomBidPlaced.length, 2)
  assert.equal(roomBidPlaced[1].bid.amount, 7.13)
  assert.equal(roomBidPlaced[1].currentPrice, 7.13)
  assert.equal(roomUpdated.length, 2)
})

test('minimum increment: below currentPrice + increment is 409 BID_TOO_LOW, the exact minimum is accepted', async () => {
  const p = await producer('Increment Farm')
  const id = await seedAuction(p.id, { currentPrice: 10, increment: 2.5 })

  const b1 = await buyer('Low Bidder')
  const low = await bid(b1.token, id, { amount: 12.49 })
  assert.equal(low.status, 409)
  assert.equal(low.body.error.code, 'BID_TOO_LOW')
  assert.deepEqual(await auctionState(id), { currentPrice: 10, bidCount: 0, leader: null })

  const b2 = await buyer('Minimum Bidder')
  const minimum = await bid(b2.token, id, { amount: 12.5 })
  assert.equal(minimum.status, 201)
  assert.equal(minimum.body.amount, 12.5)
  assert.deepEqual(await auctionState(id), { currentPrice: 12.5, bidCount: 1, leader: { id: b2.id, name: b2.name } })

  const b3 = await buyer('Late Low Bidder')
  const late = await bid(b3.token, id, { amount: 14.99 })
  assert.equal(late.status, 409)
  assert.equal(late.body.error.code, 'BID_TOO_LOW')

  const b4 = await buyer('Next Minimum Bidder')
  const next = await bid(b4.token, id, { amount: 15 })
  assert.equal(next.status, 201)
  assert.equal((await auctionState(id)).currentPrice, 15)
})

test('time and state: non-active lots are 409 AUCTION_NOT_ACTIVE; past endsAt is 409 AUCTION_CLOSED', async () => {
  const p = await producer('Clock Farm')
  const b = await buyer('Clock Bidder')
  const now = Date.now()

  const scheduled = await seedAuction(p.id, {
    status: 'scheduled',
    startsAt: new Date(now + 10 * minute),
    endsAt: new Date(now + 40 * minute),
  })
  const draft = await seedAuction(p.id, { status: 'draft' })
  const ended = await seedAuction(p.id, {
    status: 'ended',
    startsAt: new Date(now - 40 * minute),
    endsAt: new Date(now - 10 * minute),
  })
  const cancelled = await seedAuction(p.id, {
    status: 'ended',
    cancelled: true,
    startsAt: new Date(now - 40 * minute),
    endsAt: new Date(now - 10 * minute),
  })
  const past = await seedAuction(p.id, {
    status: 'active',
    startsAt: new Date(now - 30 * minute),
    endsAt: new Date(now - 1),
  })

  for (const id of [scheduled, draft, ended, cancelled]) {
    const res = await bid(b.token, id, { amount: 100 })
    assert.equal(res.status, 409, id)
    assert.equal(res.body.error.code, 'AUCTION_NOT_ACTIVE')
  }

  const late = await bid(b.token, past, { amount: 100 })
  assert.equal(late.status, 409)
  assert.equal(late.body.error.code, 'AUCTION_CLOSED')

  assert.equal(
    await BidModel.countDocuments({ auction: { $in: [scheduled, draft, ended, cancelled, past] } }),
    0,
  )
  assert.deepEqual(await auctionState(past), { currentPrice: 5, bidCount: 0, leader: null })
})

test('20 parallel bids of the same amount: one 201, one Bid, losers 409; bid-rejected only to outbid bidders', async () => {
  const p = await producer('Race Farm')
  const id = await seedAuction(p.id, { currentPrice: 10, increment: 5 })
  const bidders = await Promise.all(Array.from({ length: 20 }, (_, i) => buyer(`Race bidder ${i + 1}`)))
  const sockets = await Promise.all(bidders.map((b) => client(b.token)))
  const rejected = sockets.map((s) => collect(s, 'bid-rejected'))
  const room = await client()
  const roomPlaced = collect(room, 'bid-placed')
  room.emit('join', { room: `auction:${id}` })
  await wait(100)

  const results = await Promise.all(bidders.map((b) => bid(b.token, id, { amount: 15 })))

  const winners = results.filter((r) => r.status === 201)
  assert.equal(winners.length, 1, results.map((r) => r.status).join(','))
  for (const result of results.filter((r) => r.status !== 201)) {
    assert.equal(result.status, 409)
    assert.ok(
      ['BID_OUTBID', 'BID_TOO_LOW'].includes(result.body.error.code),
      JSON.stringify(result.body),
    )
  }

  const state = await auctionState(id)
  assert.equal(state.currentPrice, 15)
  assert.equal(state.bidCount, 1)
  assert.deepEqual(state.leader, { id: winners[0].body.bidderId, name: winners[0].body.name })
  assert.equal(await BidModel.countDocuments({ auction: id }), 1)
  const onlyBid = await BidModel.findOne({ auction: id }).lean()
  assert.equal(String(onlyBid!._id), winners[0].body.id)

  await wait(300)
  assert.equal(roomPlaced.length, 1)
  assert.equal(roomPlaced[0].currentPrice, 15)

  let outbidCount = 0
  results.forEach((result, index) => {
    if (result.status === 201) {
      assert.deepEqual(rejected[index], [])
      return
    }
    if (result.body.error.code === 'BID_OUTBID') {
      outbidCount += 1
      assert.equal(rejected[index].length, 1)
      assert.deepEqual(rejected[index][0], {
        auctionId: id,
        bidderId: bidders[index].id,
        amount: 15,
        code: 'BID_OUTBID',
        message: result.body.error.message,
      })
      return
    }
    assert.deepEqual(rejected[index], [])
  })
  assert.ok(outbidCount >= 1, 'no bidder lost the atomic race, so bid-rejected was not exercised')
})

test('rate limit: the sixth bid by one user within a second is 429', async () => {
  const p = await producer('Limit Farm')
  const b = await buyer('Frequent Bidder')
  const id = await seedAuction(p.id)

  for (const amount of [6, 7, 8, 9, 10]) {
    const res = await bid(b.token, id, { amount })
    assert.equal(res.status, 201, String(amount))
  }
  const limited = await bid(b.token, id, { amount: 11 })
  assert.equal(limited.status, 429)
  assert.equal(limited.body.error.code, 'TOO_MANY_REQUESTS')
  assert.equal(await BidModel.countDocuments({ auction: id }), 5)
  assert.deepEqual(await auctionState(id), { currentPrice: 10, bidCount: 5, leader: { id: b.id, name: b.name } })
})
