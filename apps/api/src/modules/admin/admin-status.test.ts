import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { setStorageClientForTests } from '../../lib/storage.js'
import { UserModel, type ProducerEmbedded, type UserRole } from '../users/users.model.js'

let server: Server
let baseUrl = ''
let counter = 0

type StorageBehavior = 'ok' | 'hang' | 'fail'

function installStorageStub(behavior: StorageBehavior): void {
  setStorageClientForTests({
    async send(cmd: unknown) {
      const name = (cmd as { constructor: { name: string } }).constructor.name
      if (name === 'HeadBucketCommand') {
        if (behavior === 'hang') await new Promise<never>(() => {})
        if (behavior === 'fail') throw Object.assign(new Error('NoSuchBucket'), { name: 'NoSuchBucket' })
        return {}
      }
      return {}
    },
  })
}

before(async () => {
  installStorageStub('ok')
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
  setStorageClientForTests(null)
  await new Promise<void>((resolve) => server.close(() => resolve()))
  await disconnect()
})

async function createUser(role: UserRole, producer?: Partial<ProducerEmbedded>) {
  counter += 1
  const doc = await UserModel.create({
    name: `Status User ${counter}`,
    email: `be21.${counter}@example.com`,
    passwordHash: 'x',
    role,
    ...(producer ? { producer: { farmName: `Status Farm ${counter}`, status: 'approved', ...producer } } : {}),
  })
  const id = String(doc._id)
  return { id, token: jwt.sign({ sub: id, role }, env.jwtSecret, { expiresIn: '1h', algorithm: 'HS256' }) }
}

async function call(path: string, token?: string) {
  const headers: Record<string, string> = {}
  if (token) headers.authorization = `Bearer ${token}`
  const res = await fetch(`${baseUrl}${path}`, { headers })
  return { status: res.status, body: (await res.json()) as any }
}

const byService = (body: any[]) => new Map(body.map((entry: any) => [entry.service, entry]))

test('all five services in fixed order; MongoDB and Image storage operational with latency', async () => {
  const admin = await createUser('admin')
  const res = await call('/api/admin/status', admin.token)
  assert.equal(res.status, 200)
  assert.ok(Array.isArray(res.body))
  assert.deepEqual(res.body.map((entry: any) => entry.service), [
    'API',
    'Socket.io',
    'MongoDB',
    'Image storage',
    'Swagger UI',
  ])
  for (const entry of res.body) {
    assert.deepEqual(Object.keys(entry).sort(), ['detail', 'latencyMs', 'service', 'status'])
    assert.ok(['operational', 'degraded', 'down'].includes(entry.status), entry.service)
    assert.equal(typeof entry.detail, 'string')
    assert.ok(entry.detail.length > 0)
    assert.ok(entry.latencyMs === null || (Number.isInteger(entry.latencyMs) && entry.latencyMs >= 0))
  }

  const entries = byService(res.body)
  assert.equal(entries.get('API').status, 'operational')
  assert.equal(entries.get('Socket.io').status, 'operational')
  assert.match(entries.get('Socket.io').detail, /^\d+ connected sockets?\.$/)

  const mongo = entries.get('MongoDB')
  assert.equal(mongo.status, 'operational')
  assert.ok(Number.isInteger(mongo.latencyMs) && mongo.latencyMs >= 0)

  const storage = entries.get('Image storage')
  assert.equal(storage.status, 'operational')
  assert.ok(Number.isInteger(storage.latencyMs) && storage.latencyMs >= 0)

  // The check probes env.port, not this test's random port, so it is `down` unless a dev
  // API happens to run on the machine. Either way it is reported, never an HTTP error.
  const swagger = entries.get('Swagger UI')
  assert.ok(['operational', 'down'].includes(swagger.status), swagger.status)
  if (swagger.status === 'down') assert.equal(swagger.latencyMs, null)

  // Details are fixed sentences: no hosts, urls, errors or connection strings leak.
  const raw = JSON.stringify(res.body)
  for (const leaked of ['127.0.0.1', 'mongodb://', 'Error', 'ECONNREFUSED', 'S3_', 'credential']) {
    assert.ok(!raw.includes(leaked), leaked)
  }
})

test('hanging storage check still answers in about 2s with Image storage down', async () => {
  const admin = await createUser('admin')
  installStorageStub('hang')
  try {
    const started = Date.now()
    const res = await call('/api/admin/status', admin.token)
    const elapsed = Date.now() - started
    assert.equal(res.status, 200)
    const entries = byService(res.body)
    const storage = entries.get('Image storage')
    assert.equal(storage.status, 'down')
    assert.equal(storage.latencyMs, null)
    assert.equal(storage.detail, 'Image storage did not answer.')
    // One 2 s check timeout, not five in series.
    assert.ok(elapsed >= 1800 && elapsed < 8000, `elapsed ${elapsed}ms`)
  } finally {
    installStorageStub('ok')
  }
})

test('401 without token and 403 for buyer and producer tokens', async () => {
  const buyer = await createUser('buyer')
  const producer = await createUser('producer', { status: 'approved' })
  const anon = await call('/api/admin/status')
  assert.equal(anon.status, 401)
  assert.equal(anon.body.error.code, 'UNAUTHORIZED')
  for (const user of [buyer, producer]) {
    const res = await call('/api/admin/status', user.token)
    assert.equal(res.status, 403)
    assert.equal(res.body.error.code, 'FORBIDDEN')
  }
})
