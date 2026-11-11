import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import express from 'express'
import type { Express } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { app } from './app.js'
import { env } from './config/env.js'
import { connect, disconnect } from './db/connect.js'
import { ApiError } from './lib/api-error.js'
import { escapeRegex } from './lib/escape-regex.js'
import { round2 } from './lib/money.js'
import { errorHandler, notFound } from './middleware/errors.js'
import { validate } from './middleware/validate.js'

interface ErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> }
}

interface TestServer {
  request: (path: string, init?: RequestInit) => Promise<Response>
  close: () => Promise<void>
}

// A test app is needed because app.ts already mounts notFound/errorHandler, so
// routes added to it later are unreachable. The real app is only used for the
// health route and an unknown /api route.
const testApp = express()
testApp.use(express.json({ limit: '100kb' }))

testApp.post('/api/test/boom', () => {
  throw new Error('secret detail')
})

testApp.post('/api/test/conflict', () => {
  throw new ApiError(409, 'OUT_OF_STOCK', 'Not enough stock')
})

testApp.post('/api/test/invalid', () => {
  throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid request data', { email: 'Already registered' })
})

testApp.post(
  '/api/test/validate/:id',
  validate({
    params: z.object({ id: z.string().min(1) }),
    query: z.object({ page: z.coerce.number() }),
    body: z.object({ name: z.string(), address: z.object({ city: z.string() }) }),
  }),
  (req, res) => {
    res.json({ params: req.params, query: req.query, body: req.body })
  },
)

testApp.use(notFound)
testApp.use(errorHandler)

// Defined after db/connect.js has been imported, so the global id/toJSON plugin applies.
const PluginCheck = mongoose.model('FoundationPluginCheck', new mongoose.Schema({ name: String }))

async function startServer(instance: Express): Promise<TestServer> {
  const server = await new Promise<Server>((resolve) => {
    const listener = instance.listen(0, () => resolve(listener))
  })
  const address = server.address()
  if (!address || typeof address !== 'object') throw new Error('server did not bind a port')
  const baseUrl = `http://127.0.0.1:${address.port}`
  return {
    request: (path, init) => fetch(`${baseUrl}${path}`, init),
    close: () => new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))),
  }
}

let testServer: TestServer
let realServer: TestServer

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  testServer = await startServer(testApp)
  realServer = await startServer(app)
})

after(async () => {
  await testServer.close()
  await realServer.close()
  await disconnect()
})

test('GET /api/health returns ok', async () => {
  const res = await realServer.request('/api/health')
  assert.equal(res.status, 200)
  assert.deepEqual(await res.json(), { status: 'ok' })
})

test('unknown /api route returns CT-00 NOT_FOUND', async () => {
  const res = await realServer.request('/api/does-not-exist')
  assert.equal(res.status, 404)
  const body = (await res.json()) as ErrorBody
  assert.deepEqual(body, { error: { code: 'NOT_FOUND', message: 'Not found' } })
  assert.equal('fields' in body.error, false)
})

test('malformed JSON body returns VALIDATION_ERROR', async () => {
  const res = await testServer.request('/api/test/conflict', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"name":',
  })
  assert.equal(res.status, 400)
  const body = (await res.json()) as ErrorBody
  assert.equal(body.error.code, 'VALIDATION_ERROR')
  assert.equal(typeof body.error.message, 'string')
  assert.equal('fields' in body.error, false)
})

test('thrown ApiError keeps its status, code and fields', async () => {
  const conflict = await testServer.request('/api/test/conflict', { method: 'POST' })
  assert.equal(conflict.status, 409)
  assert.deepEqual(await conflict.json(), {
    error: { code: 'OUT_OF_STOCK', message: 'Not enough stock' },
  })

  const invalid = await testServer.request('/api/test/invalid', { method: 'POST' })
  assert.equal(invalid.status, 400)
  const body = (await invalid.json()) as ErrorBody
  assert.equal(body.error.code, 'VALIDATION_ERROR')
  assert.deepEqual(body.error.fields, { email: 'Already registered' })
})

test('unknown error returns generic INTERNAL_ERROR', async (t) => {
  const log = t.mock.method(console, 'error', () => {})
  const res = await testServer.request('/api/test/boom', { method: 'POST' })
  assert.equal(res.status, 500)
  const text = await res.text()
  assert.deepEqual(JSON.parse(text), {
    error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
  })
  assert.equal(text.includes('secret detail'), false)
  assert.equal(text.includes('foundation.test'), false)
  assert.equal(text.includes(' at '), false)
  assert.ok(log.mock.callCount() >= 1)
})

test('validate parses input and reports fields by first path segment', async () => {
  const invalid = await testServer.request('/api/test/validate/abc', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 7, address: { city: 9 } }),
  })
  assert.equal(invalid.status, 400)
  const invalidBody = (await invalid.json()) as ErrorBody
  assert.equal(invalidBody.error.code, 'VALIDATION_ERROR')
  const fields = invalidBody.error.fields ?? {}
  assert.deepEqual(Object.keys(fields).sort(), ['address', 'name'])
  assert.equal('address.city' in fields, false)

  const badQuery = await testServer.request('/api/test/validate/abc?page=abc', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Farm', address: { city: 'Lisbon' } }),
  })
  assert.equal(badQuery.status, 400)
  const badQueryBody = (await badQuery.json()) as ErrorBody
  assert.deepEqual(Object.keys(badQueryBody.error.fields ?? {}), ['page'])

  const valid = await testServer.request('/api/test/validate/abc?page=2', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Farm', address: { city: 'Lisbon' }, extra: 'stripped' }),
  })
  assert.equal(valid.status, 200)
  const parsed = (await valid.json()) as {
    params: Record<string, string>
    query: Record<string, unknown>
    body: Record<string, unknown>
  }
  assert.equal(parsed.params.id, 'abc')
  assert.equal(parsed.query.page, 2)
  assert.deepEqual(parsed.body, { name: 'Farm', address: { city: 'Lisbon' } })
})

test('tests use the farm_to_table_test database', () => {
  assert.ok(env.mongoUrl.endsWith('/farm_to_table_test'))
  assert.equal(mongoose.connection.name, 'farm_to_table_test')
})

test('global plugin serialises id without _id or __v', () => {
  const doc = new PluginCheck({ name: 'check' })
  const serialised = JSON.parse(JSON.stringify(doc)) as Record<string, unknown>
  assert.equal(typeof serialised.id, 'string')
  assert.equal('_id' in serialised, false)
  assert.equal('__v' in serialised, false)
})

test('money rounding and regex escaping behave', () => {
  assert.equal(round2(2.499), 2.5)
  assert.equal(round2(10), 10)
  const pattern = new RegExp(escapeRegex('a.b*c'))
  assert.equal(pattern.test('a.b*c'), true)
  assert.equal(pattern.test('axbxc'), false)
})
