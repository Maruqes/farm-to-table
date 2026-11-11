import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { OrderModel, type OrderStatus } from '../orders/orders.model.js'
import { ProductModel } from '../products/products.model.js'
import { UserModel, type ProducerEmbedded, type UserRole } from '../users/users.model.js'
import { ReviewModel } from './reviews.model.js'
import { recomputeRatings } from './reviews.service.js'

let server: Server
let baseUrl = ''
let counter = 0

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  await Promise.all([
    UserModel.syncIndexes(),
    ProductModel.syncIndexes(),
    OrderModel.syncIndexes(),
    ReviewModel.syncIndexes(),
  ])
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`
})

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  await disconnect()
})

async function createUser(role: UserRole, name: string, producer?: Partial<ProducerEmbedded>) {
  counter += 1
  const email = `r${counter}@example.com`
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

const buyer = (name = 'Review Buyer') => createUser('buyer', name)
const producer = (name: string, extra: Partial<ProducerEmbedded> = {}) =>
  createUser('producer', name, { status: 'approved', location: 'Douro, Portugal', ...extra })

let n = 0
async function product(producerId: string, over: Record<string, unknown> = {}) {
  n += 1
  const doc = await ProductModel.create({
    producer: producerId,
    name: `Review prod ${n}`,
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

async function deliveredOrder(
  buyerId: string,
  producerId: string,
  lines: { productId: string, name: string }[],
  status: OrderStatus = 'delivered',
) {
  const doc = await OrderModel.create({
    buyer: buyerId,
    producer: producerId,
    items: lines.map((line) => ({ productId: line.productId, name: line.name, price: 2, quantity: 1, unit: 'kg' })),
    total: lines.length * 2,
    status,
    history: [{ status: 'pending', date: new Date() }, ...(status === 'pending' ? [] : [{ status, date: new Date() }])],
    fulfilment: 'pickup',
    address: null,
  })
  return String(doc._id)
}

const createReview = (token: string | undefined, body: unknown) => call('/api/reviews', 'POST', token, body)
const listMine = (token: string | undefined) => call('/api/reviews?producer=me', 'GET', token)
const report = (token: string | undefined, id: string, body: unknown) => call(`/api/reviews/${id}/report`, 'POST', token, body)
const myOrders = (token: string) => call('/api/orders/mine', 'GET', token)

const userRating = async (id: string) => {
  const raw = await UserModel.collection.findOne({ _id: new mongoose.Types.ObjectId(id) })
  return raw?.producer as { averageRating?: number, ratingCount?: number } | undefined
}

test('401 without a token; 403 for the wrong role and for unapproved producers', async () => {
  const p = await producer('Guard Farm')
  const b = await buyer('Guard Buyer')
  const admin = await createUser('admin', 'Guard Admin')
  const pending = await producer('Guard Pending', { status: 'pending' })
  const rejected = await producer('Guard Rejected', { status: 'rejected' })
  const id = String(new mongoose.Types.ObjectId())
  const body = { orderId: id, rating: 5 }

  assert.equal((await createReview(undefined, body)).status, 401)
  assert.equal((await createReview(undefined, body)).body.error.code, 'UNAUTHORIZED')
  assert.equal((await listMine(undefined)).status, 401)
  assert.equal((await report(undefined, id, { reason: 'Spam' })).status, 401)

  for (const u of [p, admin]) {
    const post = await createReview(u.token, body)
    assert.equal(post.status, 403)
    assert.equal(post.body.error.code, 'FORBIDDEN')
  }
  for (const u of [b, admin]) {
    assert.equal((await listMine(u.token)).status, 403)
    assert.equal((await listMine(u.token)).body.error.code, 'FORBIDDEN')
    assert.equal((await report(u.token, id, { reason: 'Spam' })).status, 403)
  }
  for (const u of [pending, rejected]) {
    const list = await listMine(u.token)
    assert.equal(list.status, 403)
    assert.equal(list.body.error.code, 'PRODUCER_NOT_APPROVED')
    const rep = await report(u.token, id, { reason: 'Spam' })
    assert.equal(rep.status, 403)
    assert.equal(rep.body.error.code, 'PRODUCER_NOT_APPROVED')
  }

  assert.equal((await listMine(p.token)).status, 200)
})

test('GET requires producer=me; any other query is a 400 VALIDATION_ERROR', async () => {
  const p = await producer('Query Farm')
  for (const path of ['/api/reviews', '/api/reviews?producer=other', '/api/reviews?producer=', '/api/reviews?producer=ME']) {
    const res = await call(path, 'GET', p.token)
    assert.equal(res.status, 400, path)
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    assert.ok(res.body.error.fields.producer, path)
  }
})

test('create validation: orderId, integer rating 1-5 and text max 500; nothing is created', async () => {
  const b = await buyer('Validation Buyer')
  const p = await producer('Validation Farm')
  const id = await product(p.id)
  const orderId = await deliveredOrder(b.id, p.id, [{ productId: id, name: 'Validation product' }])
  const before = await ReviewModel.countDocuments()

  const bad = async (body: unknown, field: string) => {
    const res = await createReview(b.token, body)
    assert.equal(res.status, 400, JSON.stringify(body).slice(0, 80))
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    assert.ok(res.body.error.fields[field], JSON.stringify(res.body))
  }

  await bad({}, 'orderId')
  await bad({ orderId: 5, rating: 5 }, 'orderId')
  await bad({ orderId: '', rating: 5 }, 'orderId')
  for (const rating of [0, 6, 1.5, -1, '5', null]) await bad({ orderId, rating }, 'rating')
  await bad({ orderId }, 'rating')
  await bad({ orderId, rating: 5, text: 'x'.repeat(501) }, 'text')
  await bad({ orderId, rating: 5, text: 7 }, 'text')
  const notAnObject = await createReview(b.token, 'nope')
  assert.equal(notAnObject.status, 400)
  assert.equal(notAnObject.body.error.code, 'VALIDATION_ERROR')

  for (const badReason of [{}, { reason: '' }, { reason: '   ' }, { reason: 'x'.repeat(301) }, { reason: 5 }]) {
    const res = await report(p.token, orderId, badReason)
    assert.equal(res.status, 400, JSON.stringify(badReason))
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
  }
  const notAnObjectReport = await report(p.token, orderId, 'nope')
  assert.equal(notAnObjectReport.status, 400)

  assert.equal(await ReviewModel.countDocuments(), before)
})

test('a delivered order creates one review with the order data and updates both averages', async () => {
  const b = await buyer('Happy Buyer')
  const p = await producer('Happy Farm')
  const id = await product(p.id, { name: 'Happy honey' })
  const orderId = await deliveredOrder(b.id, p.id, [{ productId: id, name: 'Happy honey' }])
  const other = await buyer('Unrelated Buyer')

  const res = await createReview(b.token, {
    orderId,
    rating: 5,
    text: '  Excellent honey  ',
    buyer: other.id,
    producer: other.id,
    products: [],
    hidden: true,
    report: { reason: 'ignored', open: true },
  })
  assert.equal(res.status, 201)
  assert.deepEqual(Object.keys(res.body).sort(), ['createdAt', 'id', 'orderId', 'rating', 'text'])
  assert.equal(res.body.orderId, orderId)
  assert.equal(res.body.rating, 5)
  assert.equal(res.body.text, 'Excellent honey')
  assert.ok(!Number.isNaN(Date.parse(res.body.createdAt)))

  const doc = await ReviewModel.findById(res.body.id).lean()
  assert.ok(doc)
  assert.equal(String(doc.order), orderId)
  assert.equal(String(doc.buyer), b.id)
  assert.equal(String(doc.producer), p.id)
  assert.deepEqual(doc.products.map(String), [id])
  assert.equal(doc.productName, 'Happy honey')
  assert.equal(doc.rating, 5)
  assert.equal(doc.text, 'Excellent honey')
  assert.equal(doc.hidden, false)
  assert.equal(doc.report, null)

  const prod = await ProductModel.findById(id).lean()
  assert.equal(prod!.averageRating, 5)
  assert.equal(prod!.ratingCount, 1)
  const rating = await userRating(p.id)
  assert.equal(rating?.averageRating, 5)
  assert.equal(rating?.ratingCount, 1)

  const mine = await myOrders(b.token)
  assert.equal(mine.status, 200)
  assert.equal(mine.body[0].reviewed, true)
  assert.deepEqual(mine.body[0].review, { rating: 5, text: 'Excellent honey' })
  const otherMine = await myOrders(other.token)
  assert.deepEqual(otherMine.body, [])

  const again = await createReview(b.token, { orderId, rating: 4 })
  assert.equal(again.status, 409)
  assert.equal(again.body.error.code, 'ALREADY_REVIEWED')
  assert.equal(await ReviewModel.countDocuments({ order: orderId }), 1)
  assert.equal((await ProductModel.findById(id).lean())!.ratingCount, 1)
})

test('two parallel ratings for one order: exactly one 201, one 409, one stored review', async () => {
  const b = await buyer('Race Buyer')
  const p = await producer('Race Farm')
  const id = await product(p.id)
  const orderId = await deliveredOrder(b.id, p.id, [{ productId: id, name: 'Race product' }])

  const [r1, r2] = await Promise.all([
    createReview(b.token, { orderId, rating: 5 }),
    createReview(b.token, { orderId, rating: 3 }),
  ])
  assert.deepEqual([r1.status, r2.status].sort(), [201, 409])
  const failed = r1.status === 409 ? r1 : r2
  assert.equal(failed.body.error.code, 'ALREADY_REVIEWED')
  assert.equal(await ReviewModel.countDocuments({ order: orderId }), 1)
})

test('ownership and state: another buyer 404, undelivered 409, unknown and malformed ids 404', async () => {
  const owner = await buyer('Owner Buyer')
  const other = await buyer('Other Buyer')
  const p = await producer('State Farm')
  const id = await product(p.id)
  const delivered = await deliveredOrder(owner.id, p.id, [{ productId: id, name: 'State product' }])
  const pending = await deliveredOrder(owner.id, p.id, [{ productId: id, name: 'State product' }], 'pending')
  const confirmed = await deliveredOrder(owner.id, p.id, [{ productId: id, name: 'State product' }], 'confirmed')
  const ready = await deliveredOrder(owner.id, p.id, [{ productId: id, name: 'State product' }], 'ready')
  const before = await ReviewModel.countDocuments()

  for (const orderId of [delivered, String(new mongoose.Types.ObjectId()), 'not-an-id', 'f'.repeat(24)]) {
    const res = await createReview(other.token, { orderId, rating: 5 })
    assert.equal(res.status, 404, orderId)
    assert.equal(res.body.error.code, 'ORDER_NOT_FOUND')
  }
  for (const orderId of [pending, confirmed, ready]) {
    const res = await createReview(owner.token, { orderId, rating: 5 })
    assert.equal(res.status, 409)
    assert.equal(res.body.error.code, 'ORDER_NOT_DELIVERED')
  }
  assert.equal(await ReviewModel.countDocuments(), before)

  const ok = await createReview(owner.token, { orderId: delivered, rating: 4 })
  assert.equal(ok.status, 201)
})

test('averages cover every non-hidden review: multi-line products and the producer', async () => {
  const b = await buyer('Average Buyer')
  const p = await producer('Average Farm')
  const q = await producer('Other Average Farm')
  const a = await product(p.id, { name: 'Average A' })
  const c = await product(p.id, { name: 'Average C' })
  const untouched = await product(q.id)

  const first = await deliveredOrder(b.id, p.id, [{ productId: a, name: 'Average A' }])
  const second = await deliveredOrder(b.id, p.id, [{ productId: a, name: 'Average A' }])
  const third = await deliveredOrder(b.id, p.id, [
    { productId: a, name: 'Average A' },
    { productId: c, name: 'Average C' },
  ])
  assert.equal((await createReview(b.token, { orderId: first, rating: 5 })).status, 201)
  const hiddenReview = await createReview(b.token, { orderId: second, rating: 2 })
  assert.equal(hiddenReview.status, 201)
  assert.equal((await createReview(b.token, { orderId: third, rating: 4, text: 'Both products' })).status, 201)

  const multiDoc = await ReviewModel.findOne({ order: third }).lean()
  assert.equal(multiDoc!.productName, null)
  assert.deepEqual(multiDoc!.products.map(String).sort(), [a, c].sort())

  let prodA = await ProductModel.findById(a).lean()
  assert.equal(prodA!.averageRating, 3.67)
  assert.equal(prodA!.ratingCount, 3)
  assert.equal((await ProductModel.findById(c).lean())!.averageRating, 4)
  assert.equal((await ProductModel.findById(untouched).lean())!.averageRating, 0)
  let producerRating = await userRating(p.id)
  assert.equal(producerRating?.averageRating, 3.67)
  assert.equal(producerRating?.ratingCount, 3)

  await ReviewModel.updateOne({ order: second }, { hidden: true })
  await recomputeRatings(p.id, [a, c])
  prodA = await ProductModel.findById(a).lean()
  assert.equal(prodA!.averageRating, 4.5)
  assert.equal(prodA!.ratingCount, 2)
  assert.equal((await ProductModel.findById(c).lean())!.averageRating, 4)
  producerRating = await userRating(p.id)
  assert.equal(producerRating?.averageRating, 4.5)
  assert.equal(producerRating?.ratingCount, 2)

  const detailA = await call(`/api/products/${a}`)
  assert.equal(detailA.status, 200)
  assert.equal(detailA.body.reviews.length, 2)
  assert.deepEqual(detailA.body.reviews.map((r: any) => r.text).sort(), ['', 'Both products'])
  const detailC = await call(`/api/products/${c}`)
  assert.deepEqual(detailC.body.reviews.map((r: any) => r.text), ['Both products'])
})

test('GET /api/products/:id lists non-hidden reviews newest first, capped at 50', async () => {
  const b = await buyer('Detail Author')
  const p = await producer('Detail Farm')
  const id = await product(p.id)
  const base = Date.now() - 60 * 60 * 1000
  const rows = Array.from({ length: 55 }, (_, i) => ({
    order: new mongoose.Types.ObjectId(),
    buyer: b.id,
    producer: p.id,
    products: [new mongoose.Types.ObjectId(id)],
    productName: 'Detail product',
    rating: (i % 5) + 1,
    text: `Review ${i}`,
    hidden: false,
    createdAt: new Date(base + i * 60 * 1000),
    updatedAt: new Date(base + i * 60 * 1000),
  }))
  rows.push(
    {
      order: new mongoose.Types.ObjectId(),
      buyer: b.id,
      producer: p.id,
      products: [new mongoose.Types.ObjectId(id)],
      productName: 'Detail product',
      rating: 1,
      text: 'Hidden newest',
      hidden: true,
      createdAt: new Date(base + 56 * 60 * 1000),
      updatedAt: new Date(base + 56 * 60 * 1000),
    } as (typeof rows)[number],
  )
  await ReviewModel.insertMany(rows)

  const res = await call(`/api/products/${id}`)
  assert.equal(res.status, 200)
  assert.equal(res.body.reviews.length, 50)
  assert.equal(res.body.reviews[0].text, 'Review 54')
  assert.equal(res.body.reviews[49].text, 'Review 5')
  assert.ok(!res.body.reviews.some((r: any) => r.text === 'Hidden newest'))
  assert.deepEqual(Object.keys(res.body.reviews[0]).sort(), ['author', 'date', 'id', 'rating', 'text'])
  assert.equal(res.body.reviews[0].author, 'Detail Author')
  assert.ok(!Number.isNaN(Date.parse(res.body.reviews[0].date)))
  const raw = JSON.stringify(res.body.reviews)
  for (const leaked of ['buyer', 'producer', 'hidden', '_id', 'report', 'email']) assert.ok(!raw.includes(leaked), leaked)
})

test('producer list is own reviews only, newest first, with the CT-16 shape and product names', async () => {
  const p = await producer('List Farm')
  const q = await producer('List Other Farm')
  const b = await buyer('List Buyer')
  const honey = await product(p.id, { name: 'List honey' })
  const cheese = await product(p.id, { name: 'List cheese' })
  const otherProduct = await product(q.id, { name: 'Other product' })
  const otherBuyer = await buyer('Other Author')

  const single = await deliveredOrder(b.id, p.id, [{ productId: honey, name: 'List honey' }])
  const multi = await deliveredOrder(b.id, p.id, [
    { productId: honey, name: 'List honey' },
    { productId: cheese, name: 'List cheese' },
  ])
  const foreign = await deliveredOrder(otherBuyer.id, q.id, [{ productId: otherProduct, name: 'Other product' }])
  const hidden = await deliveredOrder(b.id, p.id, [{ productId: honey, name: 'List honey' }])

  assert.equal((await createReview(b.token, { orderId: single, rating: 5, text: 'Single line' })).status, 201)
  assert.equal((await createReview(otherBuyer.token, { orderId: foreign, rating: 3, text: 'Foreign' })).status, 201)
  assert.equal((await createReview(b.token, { orderId: multi, rating: 4, text: 'Two lines' })).status, 201)
  assert.equal((await createReview(b.token, { orderId: hidden, rating: 1, text: 'Hidden one' })).status, 201)
  await ReviewModel.updateOne({ order: hidden }, { hidden: true })

  const res = await listMine(p.token)
  assert.equal(res.status, 200)
  assert.equal(res.body.length, 2)
  assert.deepEqual(res.body.map((r: any) => r.text), ['Two lines', 'Single line'])
  for (const review of res.body) {
    assert.deepEqual(Object.keys(review).sort(), ['author', 'id', 'product', 'rating', 'reported', 'text'])
    assert.equal(review.author, 'List Buyer')
    assert.equal(review.reported, false)
  }
  assert.equal(res.body[0].product, null)
  assert.equal(res.body[1].product, 'List honey')
  assert.equal(res.body[1].rating, 5)

  const other = await listMine(q.token)
  assert.deepEqual(other.body.map((r: any) => r.text), ['Foreign'])
  assert.equal(other.body[0].author, 'Other Author')
  assert.equal(other.body[0].product, 'Other product')

  const raw = JSON.stringify(res.body)
  for (const leaked of ['"buyer"', '"producer"', '"hidden"', '"report"', '"_id"', 'email', '"order"']) {
    assert.ok(!raw.includes(leaked), leaked)
  }
})

test('report is idempotent, keeps the first reason and blocks other producers and unknown ids', async () => {
  const b = await buyer('Report Buyer')
  const p = await producer('Report Farm')
  const q = await producer('Report Other Farm')
  const id = await product(p.id, { name: 'Report product' })
  const orderId = await deliveredOrder(b.id, p.id, [{ productId: id, name: 'Report product' }])
  const created = await createReview(b.token, { orderId, rating: 2, text: 'Not great' })
  assert.equal(created.status, 201)

  const first = await report(p.token, created.body.id, { reason: '  Spam or advertising: fake farm  ' })
  assert.equal(first.status, 200)
  assert.deepEqual(Object.keys(first.body).sort(), ['author', 'id', 'product', 'rating', 'reported', 'text'])
  assert.equal(first.body.reported, true)
  assert.equal(first.body.author, 'Report Buyer')
  let doc = await ReviewModel.findById(created.body.id).lean()
  assert.equal(doc!.report!.reason, 'Spam or advertising: fake farm')
  assert.equal(doc!.report!.open, true)
  assert.ok(doc!.report!.reportedAt instanceof Date)

  const second = await report(p.token, created.body.id, { reason: 'Different reason' })
  assert.equal(second.status, 200)
  assert.equal(second.body.reported, true)
  doc = await ReviewModel.findById(created.body.id).lean()
  assert.equal(doc!.report!.reason, 'Spam or advertising: fake farm')

  const forbidden = await report(q.token, created.body.id, { reason: 'Spam' })
  assert.equal(forbidden.status, 403)
  assert.equal(forbidden.body.error.code, 'FORBIDDEN')
  assert.equal((await ReviewModel.findById(created.body.id).lean())!.report!.reason, 'Spam or advertising: fake farm')

  for (const unknown of [String(new mongoose.Types.ObjectId()), 'not-an-id', 'f'.repeat(24)]) {
    const res = await report(p.token, unknown, { reason: 'Spam' })
    assert.equal(res.status, 404, unknown)
    assert.equal(res.body.error.code, 'REVIEW_NOT_FOUND')
  }

  const listed = await listMine(p.token)
  assert.equal(listed.body[0].reported, true)
})
