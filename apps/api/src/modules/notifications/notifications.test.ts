import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { Server as IoServer } from 'socket.io'
import { io as connectClient } from 'socket.io-client'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { attach } from '../../realtime/socket.js'
import { UserModel, type UserRole } from '../users/users.model.js'
import { NotificationModel } from './notifications.model.js'
import { notify } from './notifications.service.js'

let server: Server
let baseUrl = ''
let socketHttp: Server
let ioServer: IoServer
let socketUrl = ''
let counter = 0

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  await UserModel.syncIndexes()
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`
  socketHttp = createServer()
  ioServer = new IoServer(socketHttp)
  attach(ioServer)
  await new Promise<void>((r) => socketHttp.listen(0, r))
  socketUrl = `http://127.0.0.1:${(socketHttp.address() as { port: number }).port}`
})

after(async () => {
  await ioServer.close()
  await new Promise<void>((resolve) => server.close(() => resolve()))
  await disconnect()
})

async function createUser(role: UserRole) {
  counter += 1
  const doc = await UserModel.create({ name: `N${counter}`, email: `n${counter}@example.com`, passwordHash: 'x', role })
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

test('notify stores the doc, pushes the same payload over the socket and lists it', async () => {
  const u = await createUser('buyer')
  const s = connectClient(socketUrl, { auth: { token: u.token }, forceNew: true, reconnection: false })
  try {
    await new Promise<void>((resolve, reject) => {
      s.once('connect', () => resolve())
      s.once('connect_error', reject)
    })
    const pushed = new Promise<unknown>((resolve) => s.once('notification', resolve))
    const dto = await notify(u.id, 'order-new', 'New order')
    const got = (await Promise.race([
      pushed,
      new Promise((_, rej) => setTimeout(() => rej(new Error('no notification received')), 2000)),
    ])) as any
    assert.deepEqual(got, dto)
    assert.deepEqual(Object.keys(got).sort(), ['date', 'id', 'read', 'text', 'type'])
    assert.equal(got.read, false)
    assert.equal(got.type, 'order-new')
    assert.equal(got.text, 'New order')
    assert.ok(!Number.isNaN(Date.parse(got.date)))
    assert.equal(await NotificationModel.countDocuments({ user: u.id }), 1)
    const list = await call('/api/notifications', 'GET', u.token)
    assert.equal(list.status, 200)
    assert.deepEqual(list.body, [got])
  } finally {
    s.close()
  }
})

test('GET is newest first, capped at 100 and own only', async () => {
  const u = await createUser('producer')
  const other = await createUser('buyer')
  const base = Date.now() - 1_000_000
  await NotificationModel.insertMany(
    Array.from({ length: 105 }, (_, i) => ({
      user: u.id, type: 'order-new', text: `n${i}`, createdAt: new Date(base + i * 1000),
    })),
  )
  await notify(other.id, 'auction-won', 'not yours')
  const res = await call('/api/notifications', 'GET', u.token)
  assert.equal(res.status, 200)
  assert.equal(res.body.length, 100)
  assert.equal(res.body[0].text, 'n104')
  assert.equal(res.body[99].text, 'n5')
  assert.ok(res.body.every((n: any) => n.text !== 'not yours'))
  const empty = await createUser('buyer')
  assert.deepEqual((await call('/api/notifications', 'GET', empty.token)).body, [])
})

test('PATCH marks read, is idempotent, and 404s for foreign or invalid ids', async () => {
  const u = await createUser('buyer')
  const other = await createUser('buyer')
  const mine = await notify(u.id, 'order-status-changed', 'mine')
  const theirs = await notify(other.id, 'order-status-changed', 'theirs')
  for (let i = 0; i < 2; i++) {
    const r = await call(`/api/notifications/${mine.id}`, 'PATCH', u.token, { read: true })
    assert.equal(r.status, 200)
    assert.deepEqual(r.body, {})
  }
  assert.equal((await call('/api/notifications', 'GET', u.token)).body[0].read, true)
  for (const id of [theirs.id, 'not-an-id', 'f'.repeat(24)]) {
    const r = await call(`/api/notifications/${id}`, 'PATCH', u.token, { read: true })
    assert.equal(r.status, 404)
    assert.equal(r.body.error?.code ?? r.body.code, 'NOTIFICATION_NOT_FOUND')
  }
  assert.equal((await call('/api/notifications', 'GET', other.token)).body[0].read, false)
})

test('PATCH rejects bad bodies with VALIDATION_ERROR', async () => {
  const u = await createUser('buyer')
  const n = await notify(u.id, 'auction-won', 'x')
  for (const body of [{ read: false }, {}, { read: true, extra: 1 }]) {
    const r = await call(`/api/notifications/${n.id}`, 'PATCH', u.token, body)
    assert.equal(r.status, 400)
    assert.equal(r.body.error?.code ?? r.body.code, 'VALIDATION_ERROR')
  }
  assert.equal((await call('/api/notifications', 'GET', u.token)).body[0].read, false)
})

test('401 without token, 403 for admin', async () => {
  const admin = await createUser('admin')
  const id = 'a'.repeat(24)
  assert.equal((await call('/api/notifications')).status, 401)
  assert.equal((await call(`/api/notifications/${id}`, 'PATCH', undefined, { read: true })).status, 401)
  assert.equal((await call('/api/notifications', 'GET', admin.token)).status, 403)
  assert.equal((await call(`/api/notifications/${id}`, 'PATCH', admin.token, { read: true })).status, 403)
})
