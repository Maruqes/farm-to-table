import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { UserModel, type ProducerEmbedded, type UserRole } from '../users/users.model.js'

let server: Server
let baseUrl = ''
let counter = 0

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  await UserModel.syncIndexes()
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

const validPage = { bio: 'Organic honey', location: 'Douro, Portugal', lat: 41.1, lng: -7.8, photoUrl: 'https://example.com/a.jpg' }

test('directory lists only approved, visible producers, sorted, without email', async () => {
  await createUser('producer', 'Zeta Farm', { status: 'approved', location: 'Douro, Portugal' })
  await createUser('producer', 'Alpha (Bees)', { status: 'approved', location: 'Minho' })
  await createUser('producer', 'Pending Farm', { status: 'pending' })
  await createUser('producer', 'Rejected Farm', { status: 'rejected' })
  await createUser('producer', 'Hidden Farm', { status: 'approved', hidden: true })

  const all = await call('/api/producers')
  assert.equal(all.status, 200)
  assert.deepEqual(all.body.map((p: any) => p.name), ['Alpha (Bees)', 'Zeta Farm'])
  assert.equal(all.body[0].email, undefined)
  assert.equal(all.body[0].productCount, 0)
  assert.equal(all.body[0].averageRating, 0)

  const q = await call(`/api/producers?q=${encodeURIComponent('(bees')}`)
  assert.deepEqual(q.body.map((p: any) => p.name), ['Alpha (Bees)'])
  const loc = await call('/api/producers?location=douro,%20portugal')
  assert.deepEqual(loc.body.map((p: any) => p.name), ['Zeta Farm'])
  assert.equal((await call('/api/producers?location=douro')).body.length, 0)

  const tooLong = await call(`/api/producers?q=${'a'.repeat(101)}`)
  assert.equal(tooLong.status, 400)
  assert.equal(tooLong.body.error.code, 'VALIDATION_ERROR')
})

test('public page 404s for pending, rejected, hidden, unknown and invalid ids', async () => {
  const ids = [
    (await createUser('producer', 'P', { status: 'pending' })).id,
    (await createUser('producer', 'R', { status: 'rejected' })).id,
    (await createUser('producer', 'H', { status: 'approved', hidden: true })).id,
    (await createUser('buyer', 'B')).id,
    new mongoose.Types.ObjectId().toString(),
    'not-an-id',
  ]
  for (const id of ids) {
    const res = await call(`/api/producers/${id}`)
    assert.equal(res.status, 404)
    assert.equal(res.body.error.code, 'PRODUCER_NOT_FOUND')
  }
})

test('/me guards: no token 401, buyer 403 FORBIDDEN, pending 403 PRODUCER_NOT_APPROVED', async () => {
  assert.equal((await call('/api/producers/me')).status, 401)
  const buyer = await createUser('buyer', 'Buyer')
  const b = await call('/api/producers/me', 'GET', buyer.token)
  assert.equal(b.status, 403)
  assert.equal(b.body.error.code, 'FORBIDDEN')
  const pending = await createUser('producer', 'Pend', { status: 'pending' })
  const p = await call('/api/producers/me', 'PUT', pending.token, validPage)
  assert.equal(p.status, 403)
  assert.equal(p.body.error.code, 'PRODUCER_NOT_APPROVED')
})

test('edit own page: blank start, update visible publicly, clears, ignores name/status/hidden', async () => {
  const me = await createUser('producer', 'Mel Farm', { status: 'approved' })
  const blank = await call('/api/producers/me', 'GET', me.token)
  assert.deepEqual(blank.body, { id: me.id, name: 'Mel Farm', bio: '', location: '' })

  const put = await call('/api/producers/me', 'PUT', me.token, { ...validPage, name: 'X', status: 'pending', hidden: true })
  assert.equal(put.status, 200)
  assert.deepEqual(put.body, { id: me.id, name: 'Mel Farm', ...validPage })

  const pub = await call(`/api/producers/${me.id}`)
  assert.equal(pub.status, 200)
  assert.equal(pub.body.bio, 'Organic honey')
  assert.equal(pub.body.lat, 41.1)
  assert.deepEqual(pub.body.products, [])
  assert.equal(pub.body.email, undefined)

  const cleared = await call('/api/producers/me', 'PUT', me.token, { ...validPage, lat: null, lng: null, photoUrl: '' })
  assert.deepEqual(cleared.body, { id: me.id, name: 'Mel Farm', bio: 'Organic honey', location: 'Douro, Portugal' })
})

test('edit own page validation errors', async () => {
  const me = await createUser('producer', 'Val Farm', { status: 'approved' })
  const cases: [Record<string, unknown>, string][] = [
    [{ lat: 10, lng: null }, 'lng'],
    [{ lat: 91 }, 'lat'],
    [{ photoUrl: 'javascript:alert(1)' }, 'photoUrl'],
    [{ photoUrl: 'data:image/png;base64,AA' }, 'photoUrl'],
    [{ location: '   ' }, 'location'],
    [{ bio: 'a'.repeat(601) }, 'bio'],
  ]
  for (const [patch, field] of cases) {
    const res = await call('/api/producers/me', 'PUT', me.token, { ...validPage, ...patch })
    assert.equal(res.status, 400, field)
    assert.equal(res.body.error.code, 'VALIDATION_ERROR')
    assert.ok(res.body.error.fields[field], field)
  }
})
