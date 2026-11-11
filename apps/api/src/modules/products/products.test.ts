import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { UserModel, type ProducerEmbedded, type UserRole } from '../users/users.model.js'
import { ProductModel } from './products.model.js'

let server: Server
let baseUrl = ''
let counter = 0

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  await Promise.all([UserModel.syncIndexes(), ProductModel.syncIndexes()])
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
    email: `p${counter}@example.com`,
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
  const res = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  return { status: res.status, body: (await res.json()) as any }
}

async function producer(name: string, extra: Partial<ProducerEmbedded> = {}) {
  return createUser('producer', name, { status: 'approved', location: 'Douro, Portugal', ...extra })
}

let n = 0
async function product(producerId: string, over: Record<string, unknown> = {}) {
  n += 1
  const doc = await ProductModel.create({
    producer: producerId, name: `Prod ${n}`, category: 'honey', price: 5, unit: 'jar', stock: 3, season: 'all-year', organic: false, ...over,
  })
  return String(doc._id)
}

const ids = (res: { body: any }) => res.body.map((p: any) => p.id)

test('list never shows hidden, zero-stock, pending-producer or hidden-producer products', async () => {
  const ok = await producer('Never Ok')
  const pending = await producer('Never Pending', { status: 'pending' })
  const hiddenFarm = await producer('Never HiddenFarm', { hidden: true })
  const visible = await product(ok.id, { name: 'Neverlisted visible' })
  await product(ok.id, { name: 'Neverlisted hidden', hidden: true })
  await product(ok.id, { name: 'Neverlisted zero', stock: 0 })
  await product(pending.id, { name: 'Neverlisted pending' })
  await product(hiddenFarm.id, { name: 'Neverlisted hiddenfarm' })
  const res = await call('/api/products?q=neverlisted')
  assert.equal(res.status, 200)
  assert.deepEqual(ids(res), [visible])
})

test('filters: q on name, ingredients and producer name; token ignored', async () => {
  const a = await producer('Qzfarm Alpha')
  const b = await producer('Other Beta')
  const byName = await product(a.id, { name: 'Qzname jam' })
  const byIng = await product(b.id, { name: 'Plain', ingredients: 'wild qzing berries' })
  const byProducer = await product(a.id, { name: 'Plain 2' })
  assert.deepEqual(ids(await call('/api/products?q=QZNAME')), [byName])
  assert.deepEqual(ids(await call('/api/products?q=qzing')), [byIng])
  assert.deepEqual(ids(await call('/api/products?q=qzfarm')).sort(), [byName, byProducer].sort())
  const withToken = await call('/api/products?q=qzing', 'GET', 'garbage.token')
  assert.equal(withToken.status, 200)
  assert.deepEqual(ids(withToken), [byIng])
})

test('q is literal: ".*" matches nothing unless present literally; >100 chars is 400', async () => {
  const p = await producer('Literal Farm')
  const plain = await product(p.id, { name: 'Literalplain' })
  assert.deepEqual(ids(await call(`/api/products?q=${encodeURIComponent('.*')}`)).includes(plain), false)
  const dotted = await product(p.id, { name: 'Has .* inside' })
  assert.deepEqual(ids(await call(`/api/products?q=${encodeURIComponent('.*')}`)), [dotted])
  const res = await call(`/api/products?q=${'a'.repeat(101)}`)
  assert.equal(res.status, 400)
  assert.equal(res.body.error.code, 'VALIDATION_ERROR')
})

test('filters: producer, location, category, season, organic', async () => {
  const minho = await producer('Filt Minho', { location: 'Minho, Portugal' })
  const alentejo = await producer('Filt Alentejo', { location: 'Alentejo' })
  const x = await product(minho.id, { category: 'wine', season: 'autumn', organic: true, unit: 'bottle' })
  const y = await product(alentejo.id, { category: 'cheese', season: 'winter', organic: false, unit: 'wheel' })
  assert.deepEqual(ids(await call(`/api/products?producer=${minho.id}`)), [x])
  assert.deepEqual(ids(await call('/api/products?producer=not-an-id')), [])
  assert.deepEqual(ids(await call('/api/products?location=MINHO')), [x])
  assert.deepEqual(ids(await call('/api/products?location=alent')), [y])
  assert.deepEqual(ids(await call('/api/products?category=cheese')), [y])
  assert.deepEqual(ids(await call('/api/products?season=autumn')), [x])
  assert.deepEqual(ids(await call('/api/products?organic=true&season=autumn')), [x])
  assert.deepEqual(ids(await call(`/api/products?organic=false&producer=${alentejo.id}`)), [y])
  assert.deepEqual(ids(await call(`/api/products?organic=true&producer=${alentejo.id}`)), [])
})

test('sorts: price-asc, price-desc, rating-desc', async () => {
  const p = await producer('Sort Farm')
  const a = await product(p.id, { price: 3, averageRating: 2, ratingCount: 1 })
  const b = await product(p.id, { price: 9, averageRating: 5, ratingCount: 1 })
  const c = await product(p.id, { price: 6, averageRating: 4, ratingCount: 1 })
  const get = async (sort: string) => ids(await call(`/api/products?producer=${p.id}&sort=${sort}`))
  assert.deepEqual(await get('price-asc'), [a, c, b])
  assert.deepEqual(await get('price-desc'), [b, c, a])
  assert.deepEqual(await get('rating-desc'), [b, c, a])
})

test('list 400s name the bad parameter', async () => {
  for (const f of ['category', 'season', 'sort', 'organic']) {
    const res = await call(`/api/products?${f}=bogus`)
    assert.equal(res.status, 400, f)
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    assert.ok(res.body.error.fields[f], f)
  }
})

test('imageUrl only when imageKey is set; list item shape', async () => {
  const p = await producer('Img Farm')
  const withImg = await product(p.id, { name: 'Img yes', imageKey: 'products/a.jpg' })
  const without = await product(p.id, { name: 'Img no' })
  const res = await call(`/api/products?producer=${p.id}`)
  const yes = res.body.find((x: any) => x.id === withImg)
  const no = res.body.find((x: any) => x.id === without)
  assert.ok(yes.imageUrl.endsWith('/products/a.jpg'))
  assert.equal('imageUrl' in no, false)
  assert.deepEqual(no.producer, { id: p.id, name: 'Img Farm', location: 'Douro, Portugal' })
  assert.equal(no.averageRating, 0)
})

test('detail: stock 0 returned with description and empty reviews; imageUrl rule', async () => {
  const p = await producer('Detail Farm')
  const id = await product(p.id, { stock: 0, description: 'Tasty', imageKey: 'k.jpg' })
  const res = await call(`/api/products/${id}`, 'GET', 'garbage.token')
  assert.equal(res.status, 200)
  assert.equal(res.body.stock, 0)
  assert.equal(res.body.description, 'Tasty')
  assert.deepEqual(res.body.reviews, [])
  assert.ok(res.body.imageUrl.endsWith('/k.jpg'))
  const bare = await call(`/api/products/${await product(p.id)}`)
  assert.equal('imageUrl' in bare.body, false)
})

test('detail 404 PRODUCT_NOT_FOUND for invalid id, hidden product and non-approved producer', async () => {
  const ok = await producer('D404 Ok')
  const pending = await producer('D404 Pending', { status: 'pending' })
  const bad = [
    'not-an-id',
    String(new mongoose.Types.ObjectId()),
    await product(ok.id, { hidden: true }),
    await product(pending.id),
  ]
  for (const id of bad) {
    const res = await call(`/api/products/${id}`)
    assert.equal(res.status, 404, id)
    assert.equal(res.body.error.code, 'PRODUCT_NOT_FOUND')
  }
})

test('producer page and directory: visible products incl. stock 0, not hidden; productCount', async () => {
  const p = await producer('Page Farm')
  const a = await product(p.id, { name: 'A', stock: 0 })
  const b = await product(p.id, { name: 'B', imageKey: 'b.jpg' })
  await product(p.id, { name: 'C', hidden: true })
  const page = await call(`/api/producers/${p.id}`)
  assert.equal(page.status, 200)
  assert.deepEqual(ids({ body: page.body.products }), [a, b])
  assert.equal(page.body.products[0].stock, 0)
  assert.equal('imageUrl' in page.body.products[0], false)
  assert.ok(page.body.products[1].imageUrl.endsWith('/b.jpg'))
  const dir = await call('/api/producers?q=page%20farm')
  assert.equal(dir.body[0].productCount, 2)
})
