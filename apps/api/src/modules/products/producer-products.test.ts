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
  const text = await res.text()
  return { status: res.status, location: res.headers.get('location'), body: (text ? JSON.parse(text) : null) as any }
}

async function producer(name: string, extra: Partial<ProducerEmbedded> = {}) {
  return createUser('producer', name, { status: 'approved', location: 'Douro, Portugal', ...extra })
}

const ids = (res: { body: any }) => res.body.map((p: any) => p.id)

const valid = { name: 'Wild honey', category: 'honey', price: 7.5, unit: 'jar', stock: 4, season: 'all-year', organic: true }

async function create(token: string, over: Record<string, unknown> = {}) {
  return call('/api/products', 'POST', token, { ...valid, ...over })
}

test('own list: all own products incl. hidden and out of stock, none of others', async () => {
  const me = await producer('Own List Farm')
  const other = await producer('Own List Other')
  const a = (await create(me.token)).body.id
  const b = (await create(me.token, { stock: 0 })).body.id
  await ProductModel.updateOne({ _id: b }, { hidden: true })
  const c = (await create(other.token)).body.id
  const res = await call('/api/products?producer=me', 'GET', me.token)
  assert.equal(res.status, 200)
  const got = res.body.map((p: any) => p.id)
  assert.deepEqual([...got].sort(), [a, b].sort())
  assert.equal(got.includes(c), false)
})

test('own list: 401 no token, 403 FORBIDDEN buyer, 403 PRODUCER_NOT_APPROVED pending; plain GET stays public', async () => {
  assert.equal((await call('/api/products?producer=me')).status, 401)
  const buyer = await createUser('buyer', 'Own Buyer')
  const r1 = await call('/api/products?producer=me', 'GET', buyer.token)
  assert.equal(r1.status, 403)
  assert.equal(r1.body.error.code, 'FORBIDDEN')
  const pending = await producer('Own Pending', { status: 'pending' })
  const r2 = await call('/api/products?producer=me', 'GET', pending.token)
  assert.equal(r2.status, 403)
  assert.equal(r2.body.error.code, 'PRODUCER_NOT_APPROVED')
  assert.equal((await call('/api/products')).status, 200)
})

test('create: 201, Location, body shape; shows in public list with right producer', async () => {
  const me = await producer('Create Farm')
  const res = await create(me.token, { name: 'Createdvisible' })
  assert.equal(res.status, 201)
  assert.equal(res.location, `/api/products/${res.body.id}`)
  assert.deepEqual(
    { name: res.body.name, category: res.body.category, price: res.body.price, unit: res.body.unit, stock: res.body.stock, season: res.body.season, organic: res.body.organic },
    { ...valid, name: 'Createdvisible' },
  )
  const pub = await call(`/api/products?q=createdvisible&producer=${me.id}`)
  assert.deepEqual(ids(pub), [res.body.id])
  const doc = await ProductModel.findById(res.body.id).lean()
  assert.equal(String(doc!.producer), me.id)
})

test('create: producer/hidden/averageRating/imageKey in body are ignored', async () => {
  const me = await producer('Ignore Farm')
  const other = await producer('Ignore Other')
  const res = await create(me.token, { name: 'Ignoredfields', producer: other.id, hidden: true, averageRating: 5, imageKey: 'x/y.jpg' })
  assert.equal(res.status, 201)
  const doc = (await ProductModel.findById(res.body.id).lean()) as any
  assert.equal(String(doc.producer), me.id)
  assert.notEqual(doc.hidden, true)
  assert.ok(!doc.averageRating)
  assert.ok(!doc.imageKey)
  assert.deepEqual(ids(await call('/api/products?q=ignoredfields')), [res.body.id])
})

test('create: 400 VALIDATION_ERROR on bad name/price/stock/category', async () => {
  const me = await producer('Bad Farm')
  for (const [f, over] of [
    ['name', { name: 'x' }],
    ['price', { price: 0 }],
    ['price', { price: '5' }],
    ['stock', { stock: -1 }],
    ['stock', { stock: 1.5 }],
    ['category', { category: 'bogus' }],
  ] as const) {
    const res = await create(me.token, over)
    assert.equal(res.status, 400, JSON.stringify(over))
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    assert.ok(res.body.error.fields[f], f)
  }
})

test('create: 401 no token, 403 FORBIDDEN buyer, 403 PRODUCER_NOT_APPROVED pending', async () => {
  assert.equal((await call('/api/products', 'POST', undefined, valid)).status, 401)
  const buyer = await createUser('buyer', 'Create Buyer')
  const r1 = await create(buyer.token)
  assert.equal(r1.status, 403)
  assert.equal(r1.body.error.code, 'FORBIDDEN')
  const pending = await producer('Create Pending', { status: 'pending' })
  const r2 = await create(pending.token)
  assert.equal(r2.status, 403)
  assert.equal(r2.body.error.code, 'PRODUCER_NOT_APPROVED')
})

test('update: 200 full replace; 403 other producer; 404 unknown or malformed id', async () => {
  const me = await producer('Upd Farm')
  const other = await producer('Upd Other')
  const id = (await create(me.token)).body.id
  const next = { name: 'Updated name', category: 'cheese', price: 12, unit: 'wheel', stock: 9, season: 'winter', organic: false }
  const res = await call(`/api/products/${id}`, 'PUT', me.token, next)
  assert.equal(res.status, 200)
  assert.equal(res.body.id, id)
  for (const [k, v] of Object.entries(next)) assert.equal(res.body[k], v, k)
  const forbidden = await call(`/api/products/${id}`, 'PUT', other.token, valid)
  assert.equal(forbidden.status, 403)
  assert.equal(((await ProductModel.findById(id).lean()) as any).name, 'Updated name')
  assert.equal((await call(`/api/products/${new mongoose.Types.ObjectId()}`, 'PUT', me.token, valid)).status, 404)
  const bad = await call('/api/products/not-an-id', 'PUT', me.token, valid)
  assert.equal(bad.status, 404)
  assert.equal(bad.body.error.code, 'NOT_FOUND')
  const invalid = await call(`/api/products/${id}`, 'PUT', me.token, { ...valid, price: -1 })
  assert.equal(invalid.status, 400)
})

test('update/delete: buyer FORBIDDEN, pending PRODUCER_NOT_APPROVED, no token 401', async () => {
  const me = await producer('Guard Farm')
  const id = (await create(me.token)).body.id
  const buyer = await createUser('buyer', 'Guard Buyer')
  const pending = await producer('Guard Pending', { status: 'pending' })
  assert.equal((await call(`/api/products/${id}`, 'PUT', undefined, valid)).status, 401)
  assert.equal((await call(`/api/products/${id}`, 'DELETE')).status, 401)
  for (const method of ['PUT', 'DELETE']) {
    const b = await call(`/api/products/${id}`, method, buyer.token, valid)
    assert.equal(b.status, 403)
    assert.equal(b.body.error.code, 'FORBIDDEN')
    const p = await call(`/api/products/${id}`, method, pending.token, valid)
    assert.equal(p.status, 403)
    assert.equal(p.body.error.code, 'PRODUCER_NOT_APPROVED')
  }
})

test('delete: 204 and gone; 403 other producer; 404 unknown', async () => {
  const me = await producer('Del Farm')
  const other = await producer('Del Other')
  const id = (await create(me.token, { name: 'Deletable' })).body.id
  assert.equal((await call(`/api/products/${id}`, 'DELETE', other.token)).status, 403)
  assert.ok(await ProductModel.findById(id))
  const res = await call(`/api/products/${id}`, 'DELETE', me.token)
  assert.equal(res.status, 204)
  assert.equal(await ProductModel.findById(id), null)
  assert.deepEqual(ids(await call(`/api/products?q=deletable`)), [])
  assert.equal((await call(`/api/products/${id}`, 'DELETE', me.token)).status, 404)
  assert.equal((await call('/api/products/not-an-id', 'DELETE', me.token)).status, 404)
})
