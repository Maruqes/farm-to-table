import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { ProductModel } from '../products/products.model.js'
import { UserModel, type ProducerEmbedded, type UserRole } from '../users/users.model.js'
import { AuctionModel, type AuctionStatus } from './auctions.model.js'
import { BidModel } from './bids.model.js'

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
    AuctionModel.syncIndexes(),
    BidModel.syncIndexes(),
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
    email: `a${counter}@example.com`,
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

const producer = (name: string, extra: Partial<ProducerEmbedded> = {}) =>
  createUser('producer', name, { status: 'approved', location: 'Douro, Portugal', ...extra })

async function product(producerId: string, over: Record<string, unknown> = {}) {
  productCounter += 1
  const doc = await ProductModel.create({
    producer: producerId,
    name: `Auction product ${productCounter}`,
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
const futureIso = (minutes = 60) => new Date(Date.now() + minutes * minute).toISOString()

function validBody(productId: string, over: Record<string, unknown> = {}) {
  return {
    productId,
    quantity: 10,
    basePrice: 5,
    increment: 1,
    durationMinutes: 30,
    startsAt: futureIso(60),
    ...over,
  }
}

const create = (token: string | undefined, body: unknown) => call('/api/auctions', 'POST', token, body)
const update = (token: string | undefined, id: string, body: unknown) => call(`/api/auctions/${id}`, 'PUT', token, body)
const publish = (token: string | undefined, id: string) => call(`/api/auctions/${id}/publish`, 'POST', token)
const cancel = (token: string | undefined, id: string) => call(`/api/auctions/${id}/cancel`, 'POST', token)
const listMine = (token: string | undefined) => call('/api/auctions?producer=me', 'GET', token)
const listPublic = (query: string) => call(`/api/auctions?${query}`)
const room = (id: string, token?: string) => call(`/api/auctions/${id}`, 'GET', token)

async function seedAuction(producerId: string, over: Record<string, unknown> = {}) {
  const { productId, ...rest } = over
  const id = (productId as string | undefined) ?? (await product(producerId))
  const item = await ProductModel.findById(id).lean()
  const startsAt = new Date((rest.startsAt as string | undefined) ?? futureIso(60))
  const durationMinutes = (rest.durationMinutes as number | undefined) ?? 30
  const doc = await AuctionModel.create({
    producer: producerId,
    product: id,
    productName: item!.name,
    category: item!.category,
    unit: item!.unit,
    quantity: 10,
    basePrice: 5,
    increment: 1,
    durationMinutes,
    startsAt,
    endsAt: new Date(startsAt.getTime() + durationMinutes * minute),
    status: 'active' as AuctionStatus,
    cancelled: false,
    currentPrice: 5,
    bidCount: 0,
    leader: null,
    winner: null,
    lastViewers: 0,
    ...rest,
  })
  return String(doc._id)
}

const ids = (res: { body: any }) => res.body.map((a: any) => a.id)

async function resetAuctions() {
  await Promise.all([AuctionModel.deleteMany({}), BidModel.deleteMany({})])
}

test('manager routes: 401 without a token, 403 for other roles and unapproved producers', async () => {
  const p = await producer('Guard Farm')
  const buyerUser = await createUser('buyer', 'Guard Buyer')
  const admin = await createUser('admin', 'Guard Admin')
  const pending = await producer('Guard Pending', { status: 'pending' })
  const rejected = await producer('Guard Rejected', { status: 'rejected' })
  const id = String(new mongoose.Types.ObjectId())
  const body = validBody(String(new mongoose.Types.ObjectId()))

  assert.equal((await listMine(undefined)).status, 401)
  assert.equal((await create(undefined, body)).status, 401)
  assert.equal((await update(undefined, id, body)).status, 401)
  assert.equal((await publish(undefined, id)).status, 401)
  assert.equal((await cancel(undefined, id)).status, 401)
  assert.equal((await call('/api/auctions?producer=me&status=active')).status, 401)

  for (const u of [buyerUser, admin]) {
    const list = await listMine(u.token)
    assert.equal(list.status, 403)
    assert.equal(list.body.error.code, 'FORBIDDEN')
    for (const res of [await create(u.token, body), await update(u.token, id, body), await publish(u.token, id), await cancel(u.token, id)]) {
      assert.equal(res.status, 403)
      assert.equal(res.body.error.code, 'FORBIDDEN')
    }
  }

  for (const u of [pending, rejected]) {
    for (const res of [await listMine(u.token), await create(u.token, body), await update(u.token, id, body), await publish(u.token, id), await cancel(u.token, id)]) {
      assert.equal(res.status, 403)
      assert.equal(res.body.error.code, 'PRODUCER_NOT_APPROVED')
    }
  }

  assert.equal((await listPublic('status=active')).status, 200)
  const other = await listMine(p.token)
  assert.equal(other.status, 200)
  assert.deepEqual(other.body, [])
})

test('public list validation: status required and known, limit integer 1..20', async () => {
  const badStatus = ['/api/auctions', '/api/auctions?status=draft', '/api/auctions?status=bogus', '/api/auctions?status=ACTIVE']
  for (const path of badStatus) {
    const res = await call(path)
    assert.equal(res.status, 400, path)
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    assert.ok(res.body.error.fields.status, path)
  }

  for (const limit of ['0', '21', '1.5', 'abc', '']) {
    const res = await listPublic(`status=active&limit=${limit}`)
    assert.equal(res.status, 400, limit)
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    assert.ok(res.body.error.fields.limit, limit)
  }

  const ok = await listPublic('status=active&limit=3')
  assert.equal(ok.status, 200)
  assert.ok(Array.isArray(ok.body))

  const producerOther = await producer('Query Farm')
  const otherQuery = await call('/api/auctions?producer=other', 'GET', producerOther.token)
  assert.equal(otherQuery.status, 400)
  assert.equal(otherQuery.body.error.code, 'VALIDATION_ERROR')
})

test('public lists: only public states, right order, limit and CT-27 shape; draft/cancelled never appear', async () => {
  await resetAuctions()
  const p = await producer('List Farm')
  const now = Date.now()
  const activeSoon = await seedAuction(p.id, { status: 'active', startsAt: new Date(now - 10 * minute), endsAt: new Date(now + 10 * minute) })
  const activeLate = await seedAuction(p.id, { status: 'active', startsAt: new Date(now - 5 * minute), endsAt: new Date(now + 20 * minute) })
  const scheduled = await seedAuction(p.id, { status: 'scheduled', startsAt: new Date(now + 60 * minute), endsAt: new Date(now + 90 * minute) })
  const endedNew = await seedAuction(p.id, { status: 'ended', startsAt: new Date(now - 40 * minute), endsAt: new Date(now - 10 * minute), lastViewers: 7 })
  const endedOld = await seedAuction(p.id, { status: 'ended', startsAt: new Date(now - 60 * minute), endsAt: new Date(now - 30 * minute), lastViewers: 3 })
  await seedAuction(p.id, { status: 'ended', cancelled: true, startsAt: new Date(now - 30 * minute), endsAt: new Date(now - 5 * minute) })
  await seedAuction(p.id, { status: 'draft', startsAt: new Date(now + 120 * minute), endsAt: new Date(now + 150 * minute) })

  const active = await listPublic('status=active')
  assert.equal(active.status, 200)
  assert.deepEqual(ids(active), [activeSoon, activeLate])
  assert.deepEqual(Object.keys(active.body[0]).sort(), ['currentPrice', 'endsAt', 'id', 'product', 'status', 'viewers'])
  assert.deepEqual(Object.keys(active.body[0].product).sort(), ['category', 'id', 'name'])
  assert.equal(active.body[0].status, 'active')
  assert.equal(active.body[0].viewers, 0)
  assert.ok(!Number.isNaN(Date.parse(active.body[0].endsAt)))
  assert.equal(active.body[0].currentPrice, 5)

  const limited = await listPublic('status=active&limit=1')
  assert.deepEqual(ids(limited), [activeSoon])

  const coming = await listPublic('status=scheduled')
  assert.deepEqual(ids(coming), [scheduled])

  const ended = await listPublic('status=ended')
  assert.deepEqual(ids(ended), [endedNew, endedOld])
  assert.equal(ended.body[0].viewers, 7)
  assert.equal(ended.body[1].viewers, 3)
  assert.ok(ended.body.every((a: any) => a.status === 'ended'))

  const raw = JSON.stringify([active.body, coming.body, ended.body])
  for (const leaked of ['"_id"', 'cancelled', 'producer', 'bidCount', 'leader', 'email']) {
    assert.ok(!raw.includes(leaked), leaked)
  }
})

test('draft lifecycle: create, manager list, edit, publish scheduled, cancel', async () => {
  await resetAuctions()
  const p = await producer('Lifecycle Farm')
  const other = await producer('Lifecycle Other')
  const ownProduct = await product(p.id, { name: 'Lifecycle pears', category: 'fruit', unit: 'kg', stock: 40 })
  const secondProduct = await product(p.id, { name: 'Lifecycle cheese', category: 'cheese', unit: 'wheel' })
  const valid = validBody(ownProduct, { quantity: 12, basePrice: 7.5, increment: 2.5 })

  const first = await create(p.token, {
    ...valid,
    producer: other.id,
    status: 'active',
    currentPrice: 999,
    bidCount: 5,
    leader: { id: other.id, name: 'Injected' },
    winner: { id: other.id, name: 'Injected' },
    cancelled: true,
    endsAt: new Date(Date.now() + 999 * minute).toISOString(),
  })
  assert.equal(first.status, 201)
  assert.equal(first.location, `/api/auctions/${first.body.id}`)
  assert.deepEqual(Object.keys(first.body).sort(), [
    'basePrice', 'bidCount', 'createdAt', 'currentPrice', 'durationMinutes', 'endsAt', 'id',
    'increment', 'leader', 'product', 'quantity', 'startsAt', 'status', 'unit',
  ])
  assert.deepEqual(Object.keys(first.body.product).sort(), ['category', 'id', 'name', 'unit'])
  assert.equal(first.body.status, 'draft')
  assert.equal(first.body.product.id, ownProduct)
  assert.equal(first.body.product.name, 'Lifecycle pears')
  assert.equal(first.body.product.category, 'fruit')
  assert.equal(first.body.product.unit, 'kg')
  assert.equal(first.body.quantity, 12)
  assert.equal(first.body.unit, 'kg')
  assert.equal(first.body.basePrice, 7.5)
  assert.equal(first.body.increment, 2.5)
  assert.equal(first.body.durationMinutes, 30)
  assert.equal(first.body.currentPrice, 7.5)
  assert.equal(first.body.bidCount, 0)
  assert.equal(first.body.leader, null)
  assert.equal(first.body.endsAt, new Date(Date.parse(valid.startsAt) + 30 * minute).toISOString())
  assert.ok(!Number.isNaN(Date.parse(first.body.createdAt)))

  const doc = await AuctionModel.findById(first.body.id).lean()
  assert.equal(String(doc!.producer), p.id)
  assert.equal(doc!.status, 'draft')
  assert.equal(doc!.cancelled, false)
  assert.equal(doc!.currentPrice, 7.5)
  assert.equal(doc!.bidCount, 0)
  assert.equal(doc!.leader, null)
  assert.equal(doc!.winner, null)

  const mine = await listMine(p.token)
  assert.equal(mine.status, 200)
  assert.deepEqual(mine.body.map((a: any) => a.id), [first.body.id])
  assert.equal(mine.body[0].status, 'draft')
  const otherList = await listMine(other.token)
  assert.deepEqual(otherList.body, [])

  assert.equal((await listPublic('status=active')).body.length, 0)
  assert.equal((await listPublic('status=scheduled')).body.length, 0)
  assert.equal((await listPublic('status=ended')).body.length, 0)
  const draftRoom = await room(first.body.id)
  assert.equal(draftRoom.status, 404)
  assert.equal(draftRoom.body.error.code, 'AUCTION_NOT_FOUND')
  assert.equal((await room(first.body.id, p.token)).status, 404)

  const startsAt = futureIso(90)
  const edited = await update(p.token, first.body.id, {
    productId: secondProduct,
    quantity: 6,
    basePrice: 10,
    increment: 0.5,
    durationMinutes: 15,
    startsAt,
    status: 'active',
    currentPrice: 1,
    bidCount: 9,
  })
  assert.equal(edited.status, 200)
  assert.equal(edited.body.product.id, secondProduct)
  assert.equal(edited.body.product.name, 'Lifecycle cheese')
  assert.equal(edited.body.quantity, 6)
  assert.equal(edited.body.basePrice, 10)
  assert.equal(edited.body.increment, 0.5)
  assert.equal(edited.body.durationMinutes, 15)
  assert.equal(edited.body.startsAt, new Date(startsAt).toISOString())
  assert.equal(edited.body.endsAt, new Date(Date.parse(startsAt) + 15 * minute).toISOString())
  assert.equal(edited.body.currentPrice, 10)
  assert.equal(edited.body.bidCount, 0)
  assert.equal(edited.body.status, 'draft')

  const published = await publish(p.token, first.body.id)
  assert.equal(published.status, 200)
  assert.equal(published.body.status, 'scheduled')
  assert.equal(published.body.endsAt, edited.body.endsAt)
  assert.equal(published.body.currentPrice, 10)

  const secondEdit = await update(p.token, first.body.id, valid)
  assert.equal(secondEdit.status, 409)
  assert.equal(secondEdit.body.error.code, 'AUCTION_NOT_DRAFT')
  const secondPublish = await publish(p.token, first.body.id)
  assert.equal(secondPublish.status, 409)
  assert.equal(secondPublish.body.error.code, 'AUCTION_NOT_DRAFT')

  const publicRoom = await room(first.body.id)
  assert.equal(publicRoom.status, 200)
  assert.equal(publicRoom.body.status, 'scheduled')
  assert.equal(publicRoom.body.winner, null)
  assert.deepEqual(ids(await listPublic('status=scheduled')), [first.body.id])

  const cancelled = await cancel(p.token, first.body.id)
  assert.equal(cancelled.status, 200)
  assert.equal(cancelled.body.status, 'ended')
  assert.equal(cancelled.body.leader, null)
  assert.equal((await room(first.body.id)).status, 404)
  assert.deepEqual((await listPublic('status=ended')).body, [])
  assert.equal((await listMine(p.token)).body[0].status, 'ended')

  const again = await cancel(p.token, first.body.id)
  assert.equal(again.status, 409)
  assert.equal(again.body.error.code, 'AUCTION_ALREADY_ENDED')

  const cancelWithBids = await seedAuction(p.id, { status: 'active', bidCount: 2 })
  const withBids = await cancel(p.token, cancelWithBids)
  assert.equal(withBids.status, 409)
  assert.equal(withBids.body.error.code, 'AUCTION_HAS_BIDS')
  assert.equal((await AuctionModel.findById(cancelWithBids).lean())!.status, 'active')
})

test('publish: active when the start has passed within the window; 400 once the window is over or stock is short', async () => {
  await resetAuctions()
  const p = await producer('Publish Farm')
  const ownProduct = await product(p.id, { stock: 20 })
  const startsAt = futureIso(60)
  const draft = await create(p.token, validBody(ownProduct, { startsAt }))
  assert.equal(draft.status, 201)

  const now = Date.now()
  await AuctionModel.updateOne(
    { _id: draft.body.id },
    { $set: { startsAt: new Date(now - 5 * minute), endsAt: new Date(now + 25 * minute) } },
  )
  const active = await publish(p.token, draft.body.id)
  assert.equal(active.status, 200)
  assert.equal(active.body.status, 'active')
  assert.deepEqual(ids(await listPublic('status=active')), [draft.body.id])

  const cancelledActive = await cancel(p.token, draft.body.id)
  assert.equal(cancelledActive.status, 200)
  assert.equal(cancelledActive.body.status, 'ended')

  const lateDraft = await create(p.token, validBody(ownProduct))
  await AuctionModel.updateOne(
    { _id: lateDraft.body.id },
    { $set: { startsAt: new Date(now - 120 * minute), endsAt: new Date(now - 90 * minute) } },
  )
  const tooLate = await publish(p.token, lateDraft.body.id)
  assert.equal(tooLate.status, 400)
  assert.equal(tooLate.body.error.code, 'VALIDATION_ERROR')
  assert.ok(tooLate.body.error.fields.startsAt)
  assert.equal((await AuctionModel.findById(lateDraft.body.id).lean())!.status, 'draft')

  const scarceProduct = await product(p.id, { stock: 9 })
  const scarce = await create(p.token, validBody(scarceProduct, { quantity: 10 }))
  assert.equal(scarce.status, 400)
  assert.equal(scarce.body.error.code, 'VALIDATION_ERROR')
  assert.ok(scarce.body.error.fields.quantity)

  const stockDraft = await create(p.token, validBody(ownProduct, { quantity: 10 }))
  assert.equal(stockDraft.status, 201)
  await ProductModel.updateOne({ _id: ownProduct }, { $set: { stock: 3 } })
  const short = await publish(p.token, stockDraft.body.id)
  assert.equal(short.status, 400)
  assert.equal(short.body.error.code, 'VALIDATION_ERROR')
  assert.ok(short.body.error.fields.quantity)
  assert.equal((await AuctionModel.findById(stockDraft.body.id).lean())!.status, 'draft')
})

test('save validation: every field, id shape, integer/range rules and future start', async () => {
  const p = await producer('Validation Farm')
  const item = await product(p.id)
  const before = await AuctionModel.countDocuments()
  const valid = validBody(item)

  const bad = async (body: unknown, field: string) => {
    const res = await create(p.token, body)
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 100))
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    assert.ok(res.body.error.fields[field], JSON.stringify(res.body))
  }

  for (const field of ['productId', 'quantity', 'basePrice', 'increment', 'durationMinutes', 'startsAt']) {
    const body = { ...valid } as Record<string, unknown>
    delete body[field]
    await bad(body, field)
  }
  await bad({ ...valid, productId: 'not-an-id' }, 'productId')
  for (const quantity of [0, -1, 1.5, '10']) await bad({ ...valid, quantity }, 'quantity')
  for (const basePrice of [0, 0.001, -1, '5']) await bad({ ...valid, basePrice }, 'basePrice')
  for (const increment of [0, 0.001, -1, '1']) await bad({ ...valid, increment }, 'increment')
  for (const durationMinutes of [4, 1441, 30.5, '30']) await bad({ ...valid, durationMinutes }, 'durationMinutes')
  for (const startsAt of ['not-a-date', new Date(Date.now() - minute).toISOString()]) await bad({ ...valid, startsAt }, 'startsAt')
  const notObject = await create(p.token, 'nope')
  assert.equal(notObject.status, 400)
  assert.equal(notObject.body.error.code, 'VALIDATION_ERROR')

  assert.equal(await AuctionModel.countDocuments(), before)

  const created = await create(p.token, valid)
  assert.equal(created.status, 201)
  const editPast = await update(p.token, created.body.id, { ...valid, startsAt: new Date(Date.now() - minute).toISOString() })
  assert.equal(editPast.status, 400)
  assert.ok(editPast.body.error.fields.startsAt)
})

test('ownership: another producer cannot edit, publish or cancel; a foreign product is a 403', async () => {
  const p = await producer('Owner Farm')
  const other = await producer('Intruder Farm')
  const ownProduct = await product(p.id)
  const otherProduct = await product(other.id)
  const created = await create(p.token, validBody(ownProduct))
  assert.equal(created.status, 201)

  for (const res of [
    await update(other.token, created.body.id, validBody(otherProduct)),
    await publish(other.token, created.body.id),
    await cancel(other.token, created.body.id),
  ]) {
    assert.equal(res.status, 403)
    assert.equal(res.body.error.code, 'FORBIDDEN')
  }
  const doc = await AuctionModel.findById(created.body.id).lean()
  assert.equal(doc!.status, 'draft')
  assert.equal(String(doc!.product), ownProduct)

  for (const id of [String(new mongoose.Types.ObjectId()), 'not-an-id', 'f'.repeat(24)]) {
    for (const res of [
      await update(p.token, id, validBody(ownProduct)),
      await publish(p.token, id),
      await cancel(p.token, id),
    ]) {
      assert.equal(res.status, 404, id)
      assert.equal(res.body.error.code, 'NOT_FOUND')
    }
  }

  const foreign = await create(p.token, validBody(otherProduct))
  assert.equal(foreign.status, 403)
  assert.equal(foreign.body.error.code, 'FORBIDDEN')
  const missing = await create(p.token, validBody(String(new mongoose.Types.ObjectId())))
  assert.equal(missing.status, 403)
  assert.equal(missing.body.error.code, 'FORBIDDEN')
  assert.equal(await AuctionModel.countDocuments({ producer: p.id }), 1)
})

test('public room: CT-11 shape, newest bids capped at 50, winner only when ended, drafts never public', async () => {
  const p = await producer('Room Farm')
  const bidder = await createUser('buyer', 'Room Bidder')
  const item = await product(p.id, { name: 'Room kiwis' })
  const now = Date.now()
  const active = await seedAuction(p.id, {
    productId: item,
    status: 'active',
    startsAt: new Date(now - 10 * minute),
    endsAt: new Date(now + 20 * minute),
    currentPrice: 12,
    bidCount: 3,
    leader: { id: bidder.id, name: bidder.name },
  })
  const base = now - 60 * minute
  await BidModel.insertMany(
    Array.from({ length: 55 }, (_, i) => ({
      auction: new mongoose.Types.ObjectId(active),
      bidder: new mongoose.Types.ObjectId(bidder.id),
      name: bidder.name,
      amount: 6 + i,
      createdAt: new Date(base + i * minute),
      updatedAt: new Date(base + i * minute),
    })),
  )

  const res = await room(active)
  assert.equal(res.status, 200)
  assert.deepEqual(Object.keys(res.body).sort(), [
    'basePrice', 'bids', 'currentPrice', 'endsAt', 'id', 'increment', 'leader', 'producer',
    'product', 'quantity', 'startsAt', 'status', 'unit', 'viewerCount', 'winner',
  ])
  assert.deepEqual(Object.keys(res.body.product).sort(), ['category', 'id', 'name'])
  assert.deepEqual(Object.keys(res.body.producer).sort(), ['id', 'name'])
  assert.deepEqual(Object.keys(res.body.leader).sort(), ['id', 'name'])
  assert.equal(res.body.id, active)
  assert.equal(res.body.status, 'active')
  assert.equal(res.body.product.name, 'Room kiwis')
  assert.equal(res.body.producer.id, p.id)
  assert.equal(res.body.producer.name, 'Room Farm')
  assert.equal(res.body.quantity, 10)
  assert.equal(res.body.unit, 'kg')
  assert.equal(res.body.basePrice, 5)
  assert.equal(res.body.increment, 1)
  assert.equal(res.body.currentPrice, 12)
  assert.equal(res.body.leader.id, bidder.id)
  assert.equal(res.body.leader.name, 'Room Bidder')
  assert.equal(res.body.winner, null)
  assert.equal(res.body.viewerCount, 0)
  assert.equal(res.body.bids.length, 50)
  assert.equal(res.body.bids[0].amount, 60)
  assert.equal(res.body.bids[49].amount, 11)
  assert.deepEqual(Object.keys(res.body.bids[0]).sort(), ['amount', 'bidderId', 'date', 'id', 'name'])
  assert.equal(res.body.bids[0].name, 'Room Bidder')
  assert.equal(res.body.bids[0].bidderId, bidder.id)
  assert.ok(!Number.isNaN(Date.parse(res.body.bids[0].date)))
  const raw = JSON.stringify(res.body)
  for (const leaked of ['"_id"', 'passwordHash', 'email', 'cancelled', 'lastViewers', 'settledAt']) {
    assert.ok(!raw.includes(leaked), leaked)
  }

  const ended = await seedAuction(p.id, {
    productId: item,
    status: 'ended',
    startsAt: new Date(now - 40 * minute),
    endsAt: new Date(now - 10 * minute),
    winner: { id: bidder.id, name: bidder.name },
    lastViewers: 7,
  })
  const endedRoom = await room(ended)
  assert.equal(endedRoom.status, 200)
  assert.equal(endedRoom.body.status, 'ended')
  assert.deepEqual(endedRoom.body.winner, { id: bidder.id, name: bidder.name })
  assert.equal(endedRoom.body.viewerCount, 0)

  const draft = await seedAuction(p.id, { status: 'draft' })
  const cancelled = await seedAuction(p.id, { status: 'ended', cancelled: true })
  for (const id of [draft, cancelled]) {
    const denied = await room(id)
    assert.equal(denied.status, 404)
    assert.equal(denied.body.error.code, 'AUCTION_NOT_FOUND')
  }
  for (const id of [String(new mongoose.Types.ObjectId()), 'not-an-id', 'f'.repeat(24)]) {
    const missing = await room(id)
    assert.equal(missing.status, 404)
    assert.equal(missing.body.error.code, 'AUCTION_NOT_FOUND')
  }
})

test('product delete is blocked only by a scheduled or active auction', async () => {
  const p = await producer('Stock Farm')

  const draftProduct = await product(p.id)
  const draft = await create(p.token, validBody(draftProduct))
  assert.equal(draft.status, 201)
  assert.equal((await call(`/api/products/${draftProduct}`, 'DELETE', p.token)).status, 204)

  const liveProduct = await product(p.id)
  const live = await create(p.token, validBody(liveProduct))
  assert.equal(live.status, 201)
  assert.equal((await publish(p.token, live.body.id)).body.status, 'scheduled')
  const blocked = await call(`/api/products/${liveProduct}`, 'DELETE', p.token)
  assert.equal(blocked.status, 409)
  assert.equal(blocked.body.error.code, 'PRODUCT_IN_AUCTION')

  assert.equal((await cancel(p.token, live.body.id)).status, 200)
  assert.equal((await call(`/api/products/${liveProduct}`, 'DELETE', p.token)).status, 204)
})
