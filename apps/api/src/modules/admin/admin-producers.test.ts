import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { NotificationModel } from '../notifications/notifications.model.js'
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
    email: `be18.${counter}@example.com`,
    passwordHash: 'x',
    role,
    ...(producer ? { producer: { farmName: `Farm ${counter}`, status: 'pending', ...producer } } : {}),
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

const ADMIN_PATHS: Array<{ method: string, path: () => string, body?: unknown }> = [
  { method: 'GET', path: () => '/api/admin/producers?status=pending' },
  { method: 'POST', path: () => `/api/admin/producers/${new mongoose.Types.ObjectId()}/approve` },
  { method: 'POST', path: () => `/api/admin/producers/${new mongoose.Types.ObjectId()}/reject`, body: {} },
  { method: 'GET', path: () => '/api/admin/content?type=product' },
  { method: 'PATCH', path: () => `/api/admin/content/product/${new mongoose.Types.ObjectId()}`, body: { hidden: true } },
]

test('401 without token and 403 for buyer and producer tokens on every route', async () => {
  const buyer = await createUser('buyer')
  const producer = await createUser('producer', { status: 'approved' })
  for (const route of ADMIN_PATHS) {
    const anon = await call(route.path(), route.method, undefined, route.body)
    assert.equal(anon.status, 401, `${route.method} ${route.path()}`)
    assert.equal(anon.body.error.code, 'UNAUTHORIZED')
    for (const user of [buyer, producer]) {
      const res = await call(route.path(), route.method, user.token, route.body)
      assert.equal(res.status, 403, `${route.method} ${route.path()}`)
      assert.equal(res.body.error.code, 'FORBIDDEN')
    }
  }
})

test('list returns pending producers newest first with email and categories', async () => {
  const admin = await createUser('admin')
  const first = await createUser('producer', { status: 'pending', farmName: 'Old Farm', location: 'Minho', bio: 'Organic' })
  const second = await createUser('producer', { status: 'pending', farmName: 'New Farm' })
  await createUser('producer', { status: 'approved', farmName: 'Already In' })
  await ProductModel.create([
    { producer: first.id, name: 'Honey', category: 'honey', price: 5, unit: 'jar', stock: 2, season: 'all-year', organic: false },
    { producer: first.id, name: 'Wine', category: 'wine', price: 9, unit: 'bottle', stock: 2, season: 'autumn', organic: true },
  ])
  const res = await call('/api/admin/producers?status=pending', 'GET', admin.token)
  assert.equal(res.status, 200)
  assert.equal(res.body.length, 2)
  // Newest application first.
  assert.equal(res.body[0].id, second.id)
  assert.equal(res.body[1].id, first.id)
  assert.deepEqual(res.body[1], {
    id: first.id,
    name: 'Old Farm',
    email: res.body[1].email,
    location: 'Minho',
    bio: 'Organic',
    categories: ['honey', 'wine'],
    appliedAt: res.body[1].appliedAt,
    status: 'pending',
  })
  assert.ok(!Number.isNaN(Date.parse(res.body[1].appliedAt)))
  assert.deepEqual(res.body[0].categories, [])
  assert.equal('phone' in res.body[0], false)
  assert.equal(JSON.stringify(res.body).includes('passwordHash'), false)
})

test('list is an empty array when nobody is pending', async () => {
  const admin = await createUser('admin')
  await createUser('producer', { status: 'approved' })
  // Drain anything earlier tests left pending, then the list must be empty.
  const current: any[] = (await call('/api/admin/producers?status=pending', 'GET', admin.token)).body
  for (const p of current) {
    assert.equal((await call(`/api/admin/producers/${p.id}/approve`, 'POST', admin.token)).status, 200)
  }
  const res = await call('/api/admin/producers?status=pending', 'GET', admin.token)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, [])
})

test('approve flips pending to approved, notifies, and the old token works', async () => {
  const admin = await createUser('admin')
  const pending = await createUser('producer', { status: 'pending', farmName: 'Soon Farm' })
  const res = await call(`/api/admin/producers/${pending.id}/approve`, 'POST', admin.token)
  assert.equal(res.status, 200)
  assert.deepEqual(res.body, {})
  const doc = await UserModel.findById(pending.id).lean()
  assert.equal((doc as any).producer.status, 'approved')
  const notes = await call('/api/notifications', 'GET', pending.token)
  assert.equal(notes.status, 200)
  assert.equal(notes.body.length, 1)
  assert.equal(notes.body[0].type, 'producer-approved')
  // The old token now passes the approved-producer guard.
  const created = await call('/api/products', 'POST', pending.token, {
    name: 'Post-approval honey', category: 'honey', price: 6, unit: 'jar', stock: 4, season: 'all-year', organic: false,
  })
  assert.equal(created.status, 201)
})

test('approving twice returns 404 the second time', async () => {
  const admin = await createUser('admin')
  const pending = await createUser('producer', { status: 'pending' })
  assert.equal((await call(`/api/admin/producers/${pending.id}/approve`, 'POST', admin.token)).status, 200)
  const again = await call(`/api/admin/producers/${pending.id}/approve`, 'POST', admin.token)
  assert.equal(again.status, 404)
  assert.equal(again.body.error.code, 'PRODUCER_NOT_FOUND')
})

test('approve 404s for unknown, malformed and non-pending ids', async () => {
  const admin = await createUser('admin')
  const approved = await createUser('producer', { status: 'approved' })
  const buyer = await createUser('buyer')
  for (const id of [String(new mongoose.Types.ObjectId()), 'not-an-id', approved.id, buyer.id]) {
    const res = await call(`/api/admin/producers/${id}/approve`, 'POST', admin.token)
    assert.equal(res.status, 404, id)
    assert.equal(res.body.error.code, 'PRODUCER_NOT_FOUND')
  }
})

test('reject stores the reason, notifies, and blocks producer endpoints at once', async () => {
  const admin = await createUser('admin')
  const pending = await createUser('producer', { status: 'pending' })
  const res = await call(`/api/admin/producers/${pending.id}/reject`, 'POST', admin.token, { reason: '  No licence  ' })
  assert.equal(res.status, 200)
  const doc = await UserModel.findById(pending.id).lean()
  assert.equal((doc as any).producer.status, 'rejected')
  assert.equal((doc as any).producer.rejectReason, 'No licence')
  const notes = await call('/api/notifications', 'GET', pending.token)
  assert.equal(notes.body[0].type, 'producer-rejected')
  assert.match(notes.body[0].text, /No licence/)
  const blocked = await call('/api/products', 'POST', pending.token, {
    name: 'Should fail', category: 'honey', price: 6, unit: 'jar', stock: 1, season: 'all-year', organic: false,
  })
  assert.equal(blocked.status, 403)
  assert.equal(blocked.body.error.code, 'PRODUCER_NOT_APPROVED')
  // A decided producer cannot be flipped again from here.
  assert.equal((await call(`/api/admin/producers/${pending.id}/approve`, 'POST', admin.token)).status, 404)
})

test('reject without reason stores an empty string; over 300 chars is 400', async () => {
  const admin = await createUser('admin')
  const pending = await createUser('producer', { status: 'pending' })
  assert.equal((await call(`/api/admin/producers/${pending.id}/reject`, 'POST', admin.token, {})).status, 200)
  assert.equal(((await UserModel.findById(pending.id).lean()) as any).producer.rejectReason, '')
  const other = await createUser('producer', { status: 'pending' })
  const bad = await call(`/api/admin/producers/${other.id}/reject`, 'POST', admin.token, { reason: 'x'.repeat(301) })
  assert.equal(bad.status, 400)
  assert.equal(bad.body.error.code, 'VALIDATION_ERROR')
  assert.ok('reason' in (bad.body.error.fields ?? {}))
  assert.equal(((await UserModel.findById(other.id).lean()) as any).producer.status, 'pending')
})
