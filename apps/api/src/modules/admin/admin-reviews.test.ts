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
import { ReviewModel } from '../reviews/reviews.model.js'
import { UserModel, type ProducerEmbedded, type UserRole } from '../users/users.model.js'

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
    name: `Mod User ${counter}`,
    email: `be19.${counter}@example.com`,
    passwordHash: 'x',
    role,
    ...(producer ? { producer: { farmName: `Mod Farm ${counter}`, status: 'approved', ...producer } } : {}),
  })
  const id = String(doc._id)
  return { id, token: jwt.sign({ sub: id, role }, env.jwtSecret, { expiresIn: '1h', algorithm: 'HS256' }), name: `Mod User ${counter}` }
}

async function call(path: string, method = 'GET', token?: string, body?: unknown) {
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  if (body !== undefined) headers['content-type'] = 'application/json'
  const res = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: res.status, body: (await res.json()) as any }
}

let n = 0
async function product(producerId: string, over: Record<string, unknown> = {}) {
  n += 1
  const doc = await ProductModel.create({
    producer: producerId,
    name: `Mod prod ${n}`,
    category: 'honey',
    price: 5,
    unit: 'jar',
    stock: 10,
    season: 'all-year',
    organic: false,
    ...over,
  })
  return { id: String(doc._id), name: doc.name }
}

async function deliveredOrder(buyerId: string, producerId: string, lines: { productId: string, name: string }[]) {
  const status: OrderStatus = 'delivered'
  const doc = await OrderModel.create({
    buyer: buyerId,
    producer: producerId,
    items: lines.map((line) => ({ productId: line.productId, name: line.name, price: 2, quantity: 1, unit: 'kg' })),
    total: lines.length * 2,
    status,
    history: [{ status: 'pending', date: new Date() }, { status, date: new Date() }],
    fulfilment: 'pickup',
    address: null,
  })
  return String(doc._id)
}

async function reviewedOrder(
  buyer: { id: string, token: string },
  producerId: string,
  line: { productId: string, name: string },
  rating: number,
  text = '',
) {
  const orderId = await deliveredOrder(buyer.id, producerId, [line])
  const res = await call('/api/reviews', 'POST', buyer.token, { orderId, rating, text })
  assert.equal(res.status, 201)
  return res.body.id as string
}

const producerRating = async (id: string) => {
  const raw = await UserModel.collection.findOne({ _id: new mongoose.Types.ObjectId(id) })
  return raw?.producer as { averageRating?: number, ratingCount?: number } | undefined
}

const queue = (token?: string) => call('/api/admin/reviews?reported=true', 'GET', token)
const keep = (token: string | undefined, id: string) => call(`/api/admin/reviews/${id}/keep`, 'POST', token)
const hide = (token: string | undefined, id: string) => call(`/api/admin/reviews/${id}/hide`, 'POST', token)

test('auth: 401 without a token; 403 for buyers and producers', async () => {
  const admin = await createUser('admin')
  const buyer = await createUser('buyer')
  const farm = await createUser('producer', {})
  const unknown = String(new mongoose.Types.ObjectId())

  for (const res of [await queue(undefined), await keep(undefined, unknown), await hide(undefined, unknown)]) {
    assert.equal(res.status, 401)
    assert.equal(res.body.error.code, 'UNAUTHORIZED')
  }
  for (const u of [buyer, farm]) {
    for (const res of [await queue(u.token), await keep(u.token, unknown), await hide(u.token, unknown)]) {
      assert.equal(res.status, 403)
      assert.equal(res.body.error.code, 'FORBIDDEN')
    }
  }

  const empty = await queue(admin.token)
  assert.equal(empty.status, 200)
  assert.deepEqual(empty.body, [])
})

test('query and id validation; unknown ids are 404 REVIEW_NOT_FOUND', async () => {
  const admin = await createUser('admin')
  const unknown = String(new mongoose.Types.ObjectId())

  for (const path of ['/api/admin/reviews', '/api/admin/reviews?reported=false', '/api/admin/reviews?reported=yes']) {
    const res = await call(path, 'GET', admin.token)
    assert.equal(res.status, 400, path)
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
  }

  for (const res of [await keep(admin.token, unknown), await hide(admin.token, unknown)]) {
    assert.equal(res.status, 404)
    assert.equal(res.body.error.code, 'REVIEW_NOT_FOUND')
  }
  for (const res of [await keep(admin.token, 'not-an-id'), await hide(admin.token, 'not-an-id')]) {
    assert.equal(res.status, 404)
    assert.equal(res.body.error.code, 'REVIEW_NOT_FOUND')
  }
})

test('hide drops the review from the product page and moves both averages', async () => {
  const admin = await createUser('admin')
  const farm = await createUser('producer', { farmName: 'Hide Farm' })
  const good = await createUser('buyer')
  const bad = await createUser('buyer')
  const prod = await product(farm.id, { name: 'Hide honey' })

  const goodId = await reviewedOrder(good, farm.id, { productId: prod.id, name: prod.name }, 5, 'Superb honey')
  const badId = await reviewedOrder(bad, farm.id, { productId: prod.id, name: prod.name }, 1, 'Poor honey')

  let detail = await call(`/api/products/${prod.id}`)
  assert.equal(detail.status, 200)
  assert.equal(detail.body.reviews.length, 2)
  assert.equal(detail.body.averageRating, 3)
  assert.equal((await producerRating(farm.id))?.averageRating, 3)

  const reported = await call(`/api/reviews/${goodId}/report`, 'POST', farm.token, { reason: 'Spam' })
  assert.equal(reported.status, 200)

  const listed = await queue(admin.token)
  assert.equal(listed.status, 200)
  const entry = listed.body.find((r: any) => r.id === goodId)
  assert.deepEqual(Object.keys(entry).sort(), ['author', 'createdAt', 'id', 'producer', 'product', 'rating', 'report', 'status', 'text'])
  assert.equal(entry.author, good.name)
  assert.equal(entry.rating, 5)
  assert.equal(entry.text, 'Superb honey')
  assert.equal(entry.product, 'Hide honey')
  assert.equal(entry.producer, 'Hide Farm')
  assert.equal(entry.status, 'reported')
  assert.deepEqual(Object.keys(entry.report).sort(), ['reason', 'reportedAt'])
  assert.equal(entry.report.reason, 'Spam')
  assert.ok(!Number.isNaN(Date.parse(entry.report.reportedAt)))
  assert.ok(!listed.body.some((r: any) => r.id === badId))
  const raw = JSON.stringify(listed.body)
  for (const leaked of ['passwordHash', '"hidden"', '"open"', '"buyer"', '"order"', 'email', '_id']) {
    assert.ok(!raw.includes(leaked), leaked)
  }

  const hidden = await hide(admin.token, goodId)
  assert.equal(hidden.status, 200)
  assert.equal(hidden.body.id, goodId)
  assert.equal(hidden.body.status, 'hidden')

  // Hidden reviews stay in the queue, marked Hidden; re-hiding is idempotent.
  const again = await queue(admin.token)
  assert.equal(again.body.find((r: any) => r.id === goodId)?.status, 'hidden')
  assert.equal((await hide(admin.token, goodId)).status, 200)
  // A hidden review has no open report left to dismiss.
  assert.equal((await keep(admin.token, goodId)).status, 404)
  assert.equal((await keep(admin.token, goodId)).body.error.code, 'REVIEW_NOT_FOUND')

  detail = await call(`/api/products/${prod.id}`)
  assert.equal(detail.status, 200)
  assert.deepEqual(detail.body.reviews.map((r: any) => r.id), [badId])
  assert.equal(detail.body.averageRating, 1)
  assert.equal((await ProductModel.findById(prod.id).lean())?.ratingCount, 1)
  const rating = await producerRating(farm.id)
  assert.equal(rating?.averageRating, 1)
  assert.equal(rating?.ratingCount, 1)
})

test('keep leaves the queue and the review stays public; repeats are 404', async () => {
  const admin = await createUser('admin')
  const farm = await createUser('producer', { farmName: 'Keep Farm' })
  const buyer = await createUser('buyer')
  const prod = await product(farm.id, { name: 'Keep honey' })

  const reviewId = await reviewedOrder(buyer, farm.id, { productId: prod.id, name: prod.name }, 4, 'Nice honey')
  assert.equal((await call(`/api/reviews/${reviewId}/report`, 'POST', farm.token, { reason: 'offensive' })).status, 200)
  assert.ok((await queue(admin.token)).body.some((r: any) => r.id === reviewId))

  const kept = await keep(admin.token, reviewId)
  assert.equal(kept.status, 200)
  assert.equal(kept.body.id, reviewId)
  assert.equal(kept.body.status, 'reported')

  const listed = await queue(admin.token)
  assert.equal(listed.body.some((r: any) => r.id === reviewId), false)

  const detail = await call(`/api/products/${prod.id}`)
  assert.equal(detail.status, 200)
  assert.ok(detail.body.reviews.some((r: any) => r.id === reviewId))
  assert.equal(detail.body.averageRating, 4)
  assert.equal((await ProductModel.findById(prod.id).lean())?.ratingCount, 1)

  // Out of the queue now: both actions are 404.
  assert.equal((await keep(admin.token, reviewId)).body.error.code, 'REVIEW_NOT_FOUND')
  assert.equal((await keep(admin.token, reviewId)).status, 404)
  assert.equal((await hide(admin.token, reviewId)).status, 404)
  assert.equal((await hide(admin.token, reviewId)).body.error.code, 'REVIEW_NOT_FOUND')
})

test('queue holds open reports and hidden reviews, newest report first', async () => {
  const admin = await createUser('admin')
  const farm = await createUser('producer', { farmName: 'Order Farm' })
  const buyer = await createUser('buyer')
  const prod = await product(farm.id, { name: 'Order honey' })

  const first = await reviewedOrder(buyer, farm.id, { productId: prod.id, name: prod.name }, 2, 'First')
  const second = await reviewedOrder(buyer, farm.id, { productId: prod.id, name: prod.name }, 3, 'Second')
  assert.equal((await call(`/api/reviews/${first}/report`, 'POST', farm.token, { reason: 'spam' })).status, 200)
  assert.equal((await call(`/api/reviews/${second}/report`, 'POST', farm.token, { reason: 'other' })).status, 200)
  assert.equal((await hide(admin.token, first)).status, 200)

  const listed = await queue(admin.token)
  const ids = listed.body.map((r: any) => r.id)
  // Newest report first; the hidden review stays behind the still-open report.
  assert.ok(ids.indexOf(second) < ids.indexOf(first))
  assert.equal(listed.body.find((r: any) => r.id === second)?.status, 'reported')
  assert.equal(listed.body.find((r: any) => r.id === first)?.status, 'hidden')
})
