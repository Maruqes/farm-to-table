import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { UserModel, type ProducerEmbedded, type UserRole } from '../users/users.model.js'
import { ProductModel } from '../products/products.model.js'
import { clearCart, getCartLines } from './cart.service.js'

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
    email: `c${counter}@example.com`,
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

const buyer = (name = 'Buyer') => createUser('buyer', name)
const producer = (name: string, extra: Partial<ProducerEmbedded> = {}) =>
  createUser('producer', name, { status: 'approved', location: 'Douro, Portugal', ...extra })

let n = 0
async function product(producerId: string, over: Record<string, unknown> = {}) {
  n += 1
  const doc = await ProductModel.create({
    producer: producerId, name: `Cart prod ${n}`, category: 'honey', price: 5, unit: 'jar', stock: 10, season: 'all-year', organic: false, ...over,
  })
  return String(doc._id)
}

const put = (token: string | undefined, items: unknown) => call('/api/cart', 'PUT', token, { items })
const get = (token: string) => call('/api/cart', 'GET', token)
const pids = (res: { body: any }) => res.body.items.map((i: any) => i.productId)

test('401 without token, 403 for producer and admin', async () => {
  const p = await producer('Auth Farm')
  const admin = await createUser('admin', 'Admin')
  assert.equal((await call('/api/cart')).status, 401)
  assert.equal((await put(undefined, [])).status, 401)
  for (const u of [p, admin]) {
    assert.equal((await get(u.token)).status, 403)
    assert.equal((await put(u.token, [])).status, 403)
  }
})

test('empty cart reads as no items', async () => {
  const b = await buyer()
  const res = await get(b.token)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, { items: [] })
})

test('PUT then GET roundtrip with two producers; price/name/stock from product', async () => {
  const b = await buyer()
  const p1 = await producer('Round Farm One', { location: 'Minho' })
  const p2 = await producer('Round Farm Two')
  const a = await product(p1.id, { name: 'Round A', price: 4.5, stock: 7 })
  const c = await product(p2.id, { name: 'Round C', price: 12, stock: 9 })
  const saved = await put(b.token, [{ productId: c, quantity: 2 }, { productId: a, quantity: 3 }])
  assert.equal(saved.status, 200)
  assert.deepEqual(pids(saved), [c, a])
  const read = await get(b.token)
  assert.equal(read.status, 200)
  assert.deepEqual(read.body, saved.body)
  const lineA = read.body.items.find((i: any) => i.productId === a)
  assert.equal(lineA.name, 'Round A')
  assert.equal(lineA.price, 4.5)
  assert.equal(lineA.quantity, 3)
  assert.equal(lineA.stock, 7)
  assert.equal(lineA.producer.id, p1.id)
  assert.equal(lineA.producer.name, 'Round Farm One')
  assert.equal(lineA.producer.location, 'Minho')
})

test('client-sent price is ignored; response price follows the product', async () => {
  const b = await buyer()
  const p = await producer('Price Farm')
  const id = await product(p.id, { price: 8 })
  const res = await call('/api/cart', 'PUT', b.token, { items: [{ productId: id, quantity: 1, price: 0.01 }] })
  assert.equal(res.status, 200)
  assert.equal(res.body.items[0].price, 8)
  await ProductModel.updateOne({ _id: id }, { price: 9 })
  assert.equal((await get(b.token)).body.items[0].price, 9)
})

test('PUT replaces the whole cart; empty items clears it', async () => {
  const b = await buyer()
  const p = await producer('Replace Farm')
  const a = await product(p.id)
  const c = await product(p.id)
  await put(b.token, [{ productId: a, quantity: 1 }])
  const second = await put(b.token, [{ productId: c, quantity: 2 }])
  assert.deepEqual(pids(second), [c])
  assert.deepEqual(pids(await get(b.token)), [c])
  assert.equal((await put(b.token, [])).status, 200)
  assert.deepEqual((await get(b.token)).body, { items: [] })
})

test('400 validation: duplicates, >50 lines, bad quantities, bad body', async () => {
  const b = await buyer()
  const p = await producer('Valid Farm')
  const id = await product(p.id)
  const bad = async (items: unknown) => {
    const res = await put(b.token, items)
    assert.equal(res.status, 400, JSON.stringify(items).slice(0, 80))
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
  }
  await bad([{ productId: id, quantity: 1 }, { productId: id, quantity: 2 }])
  await bad(Array.from({ length: 51 }, () => ({ productId: new mongoose.Types.ObjectId().toString(), quantity: 1 })))
  for (const quantity of [0, 1001, 1.5, -1, '2', null]) await bad([{ productId: id, quantity }])
  await bad([{ quantity: 1 }])
  await bad('nope')
  const noItems = await call('/api/cart', 'PUT', b.token, {})
  assert.equal(noItems.status, 400)
  // boundaries are accepted
  assert.equal((await put(b.token, [{ productId: id, quantity: 1 }])).status, 200)
  const big = await product(p.id, { stock: 1000 })
  assert.equal((await put(b.token, [{ productId: big, quantity: 1000 }])).status, 200)
})

test('404 PRODUCT_NOT_FOUND for hidden, unapproved/hidden producer, unknown and invalid ids', async () => {
  const b = await buyer()
  const ok = await producer('NF Ok')
  const pending = await producer('NF Pending', { status: 'pending' })
  const hiddenFarm = await producer('NF HiddenFarm', { hidden: true })
  const good = await product(ok.id)
  const cases = [
    await product(ok.id, { hidden: true }),
    await product(pending.id),
    await product(hiddenFarm.id),
    new mongoose.Types.ObjectId().toString(),
    'not-an-id',
  ]
  for (const bad of cases) {
    const res = await put(b.token, [{ productId: good, quantity: 1 }, { productId: bad, quantity: 1 }])
    assert.equal(res.status, 404, bad)
    assert.equal(res.body.error.code, 'PRODUCT_NOT_FOUND')
  }
  assert.deepEqual((await get(b.token)).body, { items: [] })
})

test('409 STOCK_CHANGED when quantity exceeds stock; prior cart unchanged; quantity == stock ok', async () => {
  const b = await buyer()
  const p = await producer('Stock Farm')
  const a = await product(p.id, { stock: 3 })
  const c = await product(p.id, { stock: 2 })
  await put(b.token, [{ productId: a, quantity: 1 }])
  const res = await put(b.token, [{ productId: a, quantity: 3 }, { productId: c, quantity: 3 }])
  assert.equal(res.status, 409)
  assert.equal(res.body.error.code, 'STOCK_CHANGED')
  const read = await get(b.token)
  assert.deepEqual(pids(read), [a])
  assert.equal(read.body.items[0].quantity, 1)
  assert.equal((await put(b.token, [{ productId: a, quantity: 3 }, { productId: c, quantity: 2 }])).status, 200)
})

test('GET drops products that became hidden or whose producer became hidden', async () => {
  const b = await buyer()
  const p = await producer('Drop Farm')
  const q = await producer('Drop Farm Two')
  const keep = await product(p.id)
  const hide = await product(p.id)
  const farmGone = await product(q.id)
  assert.equal((await put(b.token, [{ productId: keep, quantity: 1 }, { productId: hide, quantity: 1 }, { productId: farmGone, quantity: 1 }])).status, 200)
  await ProductModel.updateOne({ _id: hide }, { hidden: true })
  assert.deepEqual(pids(await get(b.token)), [keep, farmGone])
  await UserModel.updateOne({ _id: q.id }, { 'producer.hidden': true })
  assert.deepEqual(pids(await get(b.token)), [keep])
  await ProductModel.deleteOne({ _id: keep })
  assert.deepEqual((await get(b.token)).body, { items: [] })
})

test('GET returns stored quantity above current stock, with current stock', async () => {
  const b = await buyer()
  const p = await producer('Over Farm')
  const id = await product(p.id, { stock: 5 })
  await put(b.token, [{ productId: id, quantity: 4 }])
  await ProductModel.updateOne({ _id: id }, { stock: 1 })
  const line = (await get(b.token)).body.items[0]
  assert.equal(line.quantity, 4)
  assert.equal(line.stock, 1)
  await ProductModel.updateOne({ _id: id }, { stock: 0 })
  const zero = await get(b.token)
  assert.equal(zero.body.items[0].quantity, 4)
  assert.equal(zero.body.items[0].stock, 0)
})

test('buyers are isolated from each other', async () => {
  const b1 = await buyer('Iso One')
  const b2 = await buyer('Iso Two')
  const p = await producer('Iso Farm')
  const a = await product(p.id)
  const c = await product(p.id)
  await put(b1.token, [{ productId: a, quantity: 1 }])
  assert.deepEqual((await get(b2.token)).body, { items: [] })
  await put(b2.token, [{ productId: c, quantity: 2 }])
  assert.deepEqual(pids(await get(b1.token)), [a])
  assert.deepEqual(pids(await get(b2.token)), [c])
})

test('getCartLines and clearCart', async () => {
  const b = await buyer()
  const p = await producer('Svc Farm')
  const a = await product(p.id, { stock: 4 })
  await put(b.token, [{ productId: a, quantity: 2 }])
  const lines = await getCartLines(b.id)
  assert.equal(lines.length, 1)
  assert.equal(lines[0]!.productId, a)
  assert.equal(lines[0]!.quantity, 2)
  await clearCart(b.id)
  assert.deepEqual(await getCartLines(b.id), [])
  assert.deepEqual((await get(b.token)).body, { items: [] })
  assert.deepEqual(await getCartLines(new mongoose.Types.ObjectId().toString()), [])
})
