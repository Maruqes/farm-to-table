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

async function createUser(role: UserRole, producer?: Partial<ProducerEmbedded>) {
  counter += 1
  const doc = await UserModel.create({
    name: `User ${counter}`,
    email: `be18c.${counter}@example.com`,
    passwordHash: 'x',
    role,
    ...(producer ? { producer: { farmName: `Farm ${counter}`, status: 'approved', ...producer } } : {}),
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

async function product(producerId: string, over: Record<string, unknown> = {}) {
  counter += 1
  const doc = await ProductModel.create({
    producer: producerId, name: `Content ${counter}`, category: 'honey', price: 5, unit: 'jar',
    stock: 3, season: 'all-year', organic: false, ...over,
  })
  return String(doc._id)
}

test('list needs type; unknown type is 400; both lists include hidden items', async () => {
  const admin = await createUser('admin')
  const farm = await createUser('producer', { farmName: 'Hidden Valley', hidden: true })
  const open = await createUser('producer', { farmName: 'Open Farm' })
  const visible = await product(farm.id)
  const hidden = await product(farm.id, { hidden: true })

  const missing = await call('/api/admin/content', 'GET', admin.token)
  assert.equal(missing.status, 400)
  assert.equal(missing.body.error.code, 'VALIDATION_ERROR')

  const bogusQuery = await call('/api/admin/content?type=comment', 'GET', admin.token)
  assert.equal(bogusQuery.status, 400)
  assert.equal(bogusQuery.body.error.code, 'VALIDATION_ERROR')

  const products = await call('/api/admin/content?type=product', 'GET', admin.token)
  assert.equal(products.status, 200)
  const byId = new Map(products.body.map((p: any) => [p.id, p]))
  assert.deepEqual(byId.get(visible), { id: visible, name: products.body.find((p: any) => p.id === visible).name, hidden: false })
  assert.equal((byId.get(hidden) as any).hidden, true)

  const producers = await call('/api/admin/content?type=producer', 'GET', admin.token)
  assert.equal(producers.status, 200)
  const farms = new Map(producers.body.map((p: any) => [p.id, p]))
  assert.deepEqual(farms.get(farm.id), { id: farm.id, name: 'Hidden Valley', hidden: true })
  assert.equal((farms.get(open.id) as any).hidden, false)
})

test('hiding a product removes it from the catalog and detail; unhiding restores it', async () => {
  const admin = await createUser('admin')
  const farm = await createUser('producer', { farmName: 'Catalog Farm' })
  const id = await product(farm.id, { name: 'Catalog honey' })

  const hide = await call(`/api/admin/content/product/${id}`, 'PATCH', admin.token, { hidden: true })
  assert.equal(hide.status, 200)
  assert.deepEqual(hide.body, { id, name: 'Catalog honey', hidden: true })

  const list = await call(`/api/products?producer=${farm.id}`)
  assert.equal(list.status, 200)
  assert.deepEqual(list.body.map((p: any) => p.id).includes(id), false)

  const detail = await call(`/api/products/${id}`)
  assert.equal(detail.status, 404)
  assert.equal(detail.body.error.code, 'PRODUCT_NOT_FOUND')

  const show = await call(`/api/admin/content/product/${id}`, 'PATCH', admin.token, { hidden: false })
  assert.equal(show.status, 200)
  assert.deepEqual(show.body, { id, name: 'Catalog honey', hidden: false })

  const back = await call(`/api/products?producer=${farm.id}`)
  assert.deepEqual(back.body.map((p: any) => p.id), [id])
  assert.equal((await call(`/api/products/${id}`)).status, 200)
})

test('hiding notifies the owner once; unhiding and no-ops stay silent', async () => {
  const admin = await createUser('admin')
  const farm = await createUser('producer', { farmName: 'Notify Farm' })
  const id = await product(farm.id, { name: 'Notify honey' })

  // No-op (already visible) sends nothing.
  assert.equal((await call(`/api/admin/content/product/${id}`, 'PATCH', admin.token, { hidden: false })).status, 200)
  const silent = await call('/api/notifications', 'GET', farm.token)
  assert.deepEqual(silent.body, [])

  await call(`/api/admin/content/product/${id}`, 'PATCH', admin.token, { hidden: true })
  // Hiding twice only notifies once.
  await call(`/api/admin/content/product/${id}`, 'PATCH', admin.token, { hidden: true })
  const notes = await call('/api/notifications', 'GET', farm.token)
  assert.equal(notes.body.length, 1)
  assert.equal(notes.body[0].type, 'product-hidden')
  assert.match(notes.body[0].text, /Notify honey/)

  await call(`/api/admin/content/product/${id}`, 'PATCH', admin.token, { hidden: false })
  assert.equal((await call('/api/notifications', 'GET', farm.token)).body.length, 1)
})

test('hiding a producer page removes their products from the catalog; unhiding restores', async () => {
  const admin = await createUser('admin')
  const farm = await createUser('producer', { farmName: 'Page Farm' })
  const id = await product(farm.id, { name: 'Page honey' })
  assert.equal((await call(`/api/products/${id}`)).status, 200)

  const hide = await call(`/api/admin/content/producer/${farm.id}`, 'PATCH', admin.token, { hidden: true })
  assert.equal(hide.status, 200)
  assert.deepEqual(hide.body, { id: farm.id, name: 'Page Farm', hidden: true })

  assert.deepEqual((await call(`/api/products?producer=${farm.id}`)).body, [])
  const detail = await call(`/api/products/${id}`)
  assert.equal(detail.status, 404)
  assert.equal(detail.body.error.code, 'PRODUCT_NOT_FOUND')

  const notes = await call('/api/notifications', 'GET', farm.token)
  assert.equal(notes.body.length, 1)
  assert.equal(notes.body[0].type, 'product-hidden')

  assert.equal((await call(`/api/admin/content/producer/${farm.id}`, 'PATCH', admin.token, { hidden: false })).status, 200)
  assert.equal((await call(`/api/products/${id}`)).status, 200)
})

test('PATCH validates type, id and body; unknown ids are 404 CONTENT_NOT_FOUND', async () => {
  const admin = await createUser('admin')
  const missing = String(new mongoose.Types.ObjectId())

  const bogusType = await call(`/api/admin/content/comment/${missing}`, 'PATCH', admin.token, { hidden: true })
  assert.equal(bogusType.status, 400)
  assert.equal(bogusType.body.error.code, 'VALIDATION_ERROR')

  for (const path of [`/api/admin/content/product/${missing}`, `/api/admin/content/producer/${missing}`]) {
    const res = await call(path, 'PATCH', admin.token, { hidden: true })
    assert.equal(res.status, 404, path)
    assert.equal(res.body.error.code, 'CONTENT_NOT_FOUND')
  }

  const buyer = await createUser('buyer')
  const notProducer = await call(`/api/admin/content/producer/${buyer.id}`, 'PATCH', admin.token, { hidden: true })
  assert.equal(notProducer.status, 404)
  assert.equal(notProducer.body.error.code, 'CONTENT_NOT_FOUND')

  const farm = await createUser('producer')
  const id = await product(farm.id)
  const beforeName = (await ProductModel.findById(id).lean())?.name
  for (const body of [{}, { hidden: 'yes' }, { hidden: true, name: 'hacked' }]) {
    if ('name' in (body as object)) {
      const res = await call(`/api/admin/content/product/${id}`, 'PATCH', admin.token, body)
      assert.equal(res.status, 200)
      assert.equal('name' in res.body && res.body.name === 'hacked', false)
    } else {
      const res = await call(`/api/admin/content/product/${id}`, 'PATCH', admin.token, body)
      assert.equal(res.status, 400, JSON.stringify(body))
      assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    }
  }
  // The PATCH above only ever touches `hidden`.
  assert.equal((await ProductModel.findById(id).lean())?.name, beforeName)
})
