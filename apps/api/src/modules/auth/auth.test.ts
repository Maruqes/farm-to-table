import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, beforeEach, test } from 'node:test'
import express from 'express'
import type { Express } from 'express'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { requireApprovedProducer, requireAuth, requireRole } from '../../middleware/auth.js'
import { errorHandler, notFound } from '../../middleware/errors.js'
import { UserModel } from '../users/users.model.js'
import { authLimiter } from './auth.routes.js'

interface ErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> }
}

interface AuthUserBody {
  id: string
  name: string
  email: string
  role: string
  producerStatus?: string
}

interface AuthBody {
  user: AuthUserBody
  token: string
}

interface DecodedJwt {
  header: { alg: string; typ?: string }
  payload: { sub?: unknown; role?: unknown; iat: number; exp: number }
  signature: string
}

interface TestServer {
  request: (path: string, init?: RequestInit) => Promise<Response>
  close: () => Promise<void>
}

const PASSWORD = 'supersecret'
// IPv4 requests from the local test server use 127.0.0.1; the mapped form is
// added in case the listener ever hands back a dual-stack address.
const LIMITER_KEYS = ['127.0.0.1', '::ffff:127.0.0.1']

// The real app mounts notFound/errorHandler, so guard routes need their own app.
const guardApp = express()
guardApp.use(express.json({ limit: '100kb' }))

guardApp.get('/test/auth', requireAuth, (req, res) => {
  res.json({ user: req.user })
})

guardApp.get('/test/admin', requireAuth, requireRole('admin'), (_req, res) => {
  res.json({ ok: true })
})

guardApp.get('/test/producer', requireAuth, requireApprovedProducer, (_req, res) => {
  res.json({ ok: true })
})

guardApp.use(notFound)
guardApp.use(errorHandler)

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

let authServer: TestServer
let guardServer: TestServer

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  // dropDatabase() also drops the unique email index; rebuild it so duplicate
  // registrations are rejected by Mongo, not only by a pre-check.
  await UserModel.syncIndexes()
  authServer = await startServer(app)
  guardServer = await startServer(guardApp)
})

after(async () => {
  await authServer.close()
  await guardServer.close()
  await disconnect()
})

beforeEach(async () => {
  for (const key of LIMITER_KEYS) await authLimiter.resetKey(key)
})

let emailCounter = 0

function uniqueEmail(prefix: string): string {
  emailCounter += 1
  return `${prefix}.${emailCounter}@example.com`
}

function jsonRequest(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }
}

async function register(body: unknown): Promise<Response> {
  return authServer.request('/api/auth/register', jsonRequest(body))
}

async function login(body: unknown): Promise<Response> {
  return authServer.request('/api/auth/login', jsonRequest(body))
}

async function readError(res: Response): Promise<ErrorBody> {
  return (await res.json()) as ErrorBody
}

async function expectError(res: Response, status: number, code: string): Promise<ErrorBody> {
  assert.equal(res.status, status)
  const body = await readError(res)
  assert.equal(body.error.code, code)
  assert.equal(typeof body.error.message, 'string')
  return body
}

function signWith(payload: Record<string, unknown>, secret: string, expiresIn: SignOptions['expiresIn']): string {
  return jwt.sign(payload, secret, { expiresIn, algorithm: 'HS256' })
}

function unsignedToken(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>): string => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`
}

function decodeToken(token: string): DecodedJwt {
  const decoded = jwt.decode(token, { complete: true })
  if (!decoded) throw new Error('token did not decode')
  return decoded as unknown as DecodedJwt
}

function bearer(token: string): RequestInit {
  return { headers: { authorization: `Bearer ${token}` } }
}

test('register buyer returns 201 with AuthResponse and a 2h HS256 token', async () => {
  const email = uniqueEmail('buyer')
  const res = await register({ name: 'Ana Buyer', email, password: PASSWORD, role: 'buyer' })
  assert.equal(res.status, 201)

  const body = (await res.json()) as AuthBody
  assert.deepEqual(Object.keys(body).sort(), ['token', 'user'])
  assert.deepEqual(Object.keys(body.user).sort(), ['email', 'id', 'name', 'role'])
  assert.equal(typeof body.user.id, 'string')
  assert.ok(body.user.id.length > 0)
  assert.equal(body.user.name, 'Ana Buyer')
  assert.equal(body.user.email, email)
  assert.equal(body.user.role, 'buyer')
  assert.equal('producerStatus' in body.user, false)
  assert.equal(typeof body.token, 'string')

  const decoded = decodeToken(body.token)
  assert.equal(decoded.header.alg, 'HS256')
  assert.equal(decoded.payload.sub, body.user.id)
  assert.equal(decoded.payload.role, 'buyer')
  assert.equal(decoded.payload.exp - decoded.payload.iat, 7200)
})

test('register producer stores a pending producer with farmName and location', async () => {
  const email = uniqueEmail('producer')
  const res = await register({
    name: 'Paulo Producer',
    email,
    password: PASSWORD,
    role: 'producer',
    farmName: 'Quinta do Vale',
    locality: 'Sintra',
  })
  assert.equal(res.status, 201)

  const body = (await res.json()) as AuthBody
  assert.equal(body.user.role, 'producer')
  assert.equal(body.user.producerStatus, 'pending')

  const doc = await UserModel.findOne({ email })
  assert.ok(doc)
  assert.equal(doc.producer?.status, 'pending')
  assert.equal(doc.producer?.farmName, 'Quinta do Vale')
  assert.equal(doc.producer?.location, 'Sintra')
})

test('login returns AuthResponse with producerStatus only for producers and matches email case-insensitively', async () => {
  const producerEmail = uniqueEmail('login.producer')
  const producerReg = await register({
    name: 'Login Producer',
    email: producerEmail,
    password: PASSWORD,
    role: 'producer',
    farmName: 'Login Farm',
    locality: 'Braga',
  })
  assert.equal(producerReg.status, 201)

  const producerLogin = await login({ email: producerEmail, password: PASSWORD })
  assert.equal(producerLogin.status, 200)
  const producerBody = (await producerLogin.json()) as AuthBody
  assert.equal(producerBody.user.role, 'producer')
  assert.equal(producerBody.user.producerStatus, 'pending')
  assert.equal(typeof producerBody.token, 'string')

  const buyerReg = await register({ name: 'Case Buyer', email: 'A@B.com', password: PASSWORD, role: 'buyer' })
  assert.equal(buyerReg.status, 201)

  const buyerLogin = await login({ email: ' a@b.com ', password: PASSWORD })
  assert.equal(buyerLogin.status, 200)
  const buyerBody = (await buyerLogin.json()) as AuthBody
  assert.equal(buyerBody.user.role, 'buyer')
  assert.equal(buyerBody.user.email, 'a@b.com')
  assert.equal('producerStatus' in buyerBody.user, false)
})

test('register validation rejects missing, malformed and forbidden fields', async () => {
  const missing = await register({})
  const missingBody = await expectError(missing, 400, 'VALIDATION_ERROR')
  const missingFields = missingBody.error.fields ?? {}
  for (const field of ['name', 'email', 'password', 'role']) {
    assert.ok(field in missingFields, `expected a field error for ${field}`)
  }

  const shortPassword = await register({
    name: 'Short Password',
    email: uniqueEmail('short'),
    password: 'short',
    role: 'buyer',
  })
  const shortBody = await expectError(shortPassword, 400, 'VALIDATION_ERROR')
  assert.ok('password' in (shortBody.error.fields ?? {}))

  const longPassword = await register({
    name: 'Long Password',
    email: uniqueEmail('long'),
    password: 'x'.repeat(73),
    role: 'buyer',
  })
  const longBody = await expectError(longPassword, 400, 'VALIDATION_ERROR')
  assert.ok('password' in (longBody.error.fields ?? {}))

  const producerMissing = await register({
    name: 'No Farm',
    email: uniqueEmail('nofarm'),
    password: PASSWORD,
    role: 'producer',
  })
  const producerMissingBody = await expectError(producerMissing, 400, 'VALIDATION_ERROR')
  const producerMissingFields = producerMissingBody.error.fields ?? {}
  assert.ok('farmName' in producerMissingFields)
  assert.ok('locality' in producerMissingFields)

  const adminEmail = uniqueEmail('admin')
  const admin = await register({
    name: 'Sneaky Admin',
    email: adminEmail,
    password: PASSWORD,
    role: 'admin',
  })
  const adminBody = await expectError(admin, 400, 'VALIDATION_ERROR')
  assert.ok('role' in (adminBody.error.fields ?? {}))
  assert.equal(await UserModel.countDocuments({ email: adminEmail }), 0)

  const extraEmail = uniqueEmail('extra')
  const extra = await register({
    name: 'Extra Keys',
    email: extraEmail,
    password: PASSWORD,
    role: 'buyer',
    producer: { status: 'approved' },
    passwordHash: 'plain-text-should-be-ignored',
  })
  assert.equal(extra.status, 201)
  const extraDoc = await UserModel.findOne({ email: extraEmail }).select('+passwordHash')
  assert.ok(extraDoc)
  assert.equal(extraDoc.producer, undefined)
  assert.equal(extraDoc.passwordHash === 'plain-text-should-be-ignored', false)
  assert.ok(extraDoc.passwordHash.startsWith('$2b$12$'))
})

test('duplicate email is a 400 email field error, also for mixed case and a parallel race', async () => {
  const email = uniqueEmail('dupe')
  const body = { name: 'Dupe User', email, password: PASSWORD, role: 'buyer' }

  const first = await register(body)
  assert.equal(first.status, 201)

  const second = await register(body)
  const secondBody = await expectError(second, 400, 'VALIDATION_ERROR')
  assert.deepEqual(secondBody.error.fields, { email: 'Already registered' })

  const mixedCase = await register({ ...body, email: email.toUpperCase() })
  const mixedCaseBody = await expectError(mixedCase, 400, 'VALIDATION_ERROR')
  assert.deepEqual(mixedCaseBody.error.fields, { email: 'Already registered' })

  const raceEmail = uniqueEmail('race')
  const raceBody = { name: 'Race User', email: raceEmail, password: PASSWORD, role: 'buyer' }
  const results = await Promise.all([register(raceBody), register(raceBody)])
  const statuses = results.map((res) => res.status).sort((a, b) => a - b)
  assert.deepEqual(statuses, [201, 400])

  const failed = results.find((res) => res.status === 400)
  assert.ok(failed)
  const failedBody = await expectError(failed, 400, 'VALIDATION_ERROR')
  assert.deepEqual(failedBody.error.fields, { email: 'Already registered' })
  assert.equal(await UserModel.countDocuments({ email: raceEmail }), 1)
})

test('login with unknown email and wrong password returns byte-identical 401 INVALID_CREDENTIALS bodies', async () => {
  const email = uniqueEmail('creds')
  const reg = await register({ name: 'Creds User', email, password: PASSWORD, role: 'buyer' })
  assert.equal(reg.status, 201)

  const wrongPassword = await login({ email, password: 'wrongpassword' })
  const unknownEmail = await login({ email: uniqueEmail('missing'), password: PASSWORD })
  assert.equal(wrongPassword.status, 401)
  assert.equal(unknownEmail.status, 401)

  const wrongText = await wrongPassword.text()
  const unknownText = await unknownEmail.text()
  assert.equal(wrongText, unknownText)

  const body = JSON.parse(wrongText) as ErrorBody
  assert.equal(body.error.code, 'INVALID_CREDENTIALS')
  assert.equal(typeof body.error.message, 'string')
  assert.equal('fields' in body.error, false)
})

test('passwordHash never appears in any response and is excluded from default queries', async () => {
  const email = uniqueEmail('secret')
  const body = { name: 'Secret User', email, password: PASSWORD, role: 'buyer' }

  const registerRes = await register(body)
  const registerText = await registerRes.text()
  assert.equal(registerRes.status, 201)

  const loginRes = await login({ email, password: PASSWORD })
  const loginText = await loginRes.text()
  assert.equal(loginRes.status, 200)

  const duplicateRes = await register(body)
  const duplicateText = await duplicateRes.text()
  assert.equal(duplicateRes.status, 400)

  const wrongRes = await login({ email, password: 'wrongpassword' })
  const wrongText = await wrongRes.text()
  assert.equal(wrongRes.status, 401)

  const withHash = await UserModel.findOne({ email }).select('+passwordHash')
  assert.ok(withHash)
  const storedHash = withHash.passwordHash
  assert.equal(typeof storedHash, 'string')
  assert.ok(storedHash.startsWith('$2b$12$'))

  for (const text of [registerText, loginText, duplicateText, wrongText]) {
    assert.equal(text.includes('passwordHash'), false)
    assert.equal(text.includes(storedHash), false)
  }

  const plain = await UserModel.findOne({ email })
  assert.ok(plain)
  assert.equal((plain as unknown as Record<string, unknown>).passwordHash, undefined)
})

test('requireAuth rejects every invalid token shape and accepts a valid one', async () => {
  const cases: Array<{ label: string; init?: RequestInit }> = [
    { label: 'no header' },
    { label: 'non-Bearer header', init: { headers: { authorization: 'Basic abc123' } } },
    { label: 'malformed token', init: { headers: { authorization: 'Bearer not-a-jwt' } } },
    {
      label: 'expired token',
      init: bearer(signWith({ sub: 'expired-user', role: 'buyer' }, env.jwtSecret, -10)),
    },
    {
      label: 'wrong secret',
      init: bearer(signWith({ sub: 'other-user', role: 'buyer' }, 'not-the-real-secret', '2h')),
    },
    {
      label: 'alg none',
      init: bearer(unsignedToken({ sub: 'unsigned-user', role: 'buyer' })),
    },
    {
      label: 'missing role',
      init: bearer(signWith({ sub: 'roleless-user' }, env.jwtSecret, '2h')),
    },
  ]

  for (const entry of cases) {
    const res = await guardServer.request('/test/auth', entry.init)
    assert.equal(res.status, 401, entry.label)
    const body = await readError(res)
    assert.equal(body.error.code, 'UNAUTHORIZED', entry.label)
  }

  const validToken = signWith({ sub: 'user-123', role: 'buyer' }, env.jwtSecret, '2h')
  const valid = await guardServer.request('/test/auth', bearer(validToken))
  assert.equal(valid.status, 200)
  assert.deepEqual(await valid.json(), { user: { sub: 'user-123', role: 'buyer' } })
})

test('requireRole allows only the listed roles', async () => {
  const buyerToken = signWith({ sub: 'buyer-1', role: 'buyer' }, env.jwtSecret, '2h')
  const buyer = await guardServer.request('/test/admin', bearer(buyerToken))
  await expectError(buyer, 403, 'FORBIDDEN')

  const adminToken = signWith({ sub: 'admin-1', role: 'admin' }, env.jwtSecret, '2h')
  const admin = await guardServer.request('/test/admin', bearer(adminToken))
  assert.equal(admin.status, 200)
  assert.deepEqual(await admin.json(), { ok: true })
})

test('requireApprovedProducer reads the status from the database on every request', async () => {
  const email = uniqueEmail('approval')
  const reg = await register({
    name: 'Approval Candidate',
    email,
    password: PASSWORD,
    role: 'producer',
    farmName: 'Horta Nova',
    locality: 'Porto',
  })
  assert.equal(reg.status, 201)
  const produced = (await reg.json()) as AuthBody
  const authorization = bearer(produced.token)

  const pending = await guardServer.request('/test/producer', authorization)
  await expectError(pending, 403, 'PRODUCER_NOT_APPROVED')

  await UserModel.updateOne({ _id: produced.user.id }, { 'producer.status': 'rejected' })
  const rejected = await guardServer.request('/test/producer', authorization)
  await expectError(rejected, 403, 'PRODUCER_NOT_APPROVED')

  await UserModel.updateOne({ _id: produced.user.id }, { 'producer.status': 'approved' })
  const approved = await guardServer.request('/test/producer', authorization)
  assert.equal(approved.status, 200)
  assert.deepEqual(await approved.json(), { ok: true })

  await UserModel.updateOne({ _id: produced.user.id }, { 'producer.status': 'rejected' })
  const rejectedAgain = await guardServer.request('/test/producer', authorization)
  await expectError(rejectedAgain, 403, 'PRODUCER_NOT_APPROVED')

  const buyerEmail = uniqueEmail('approval.buyer')
  const buyerReg = await register({ name: 'Approval Buyer', email: buyerEmail, password: PASSWORD, role: 'buyer' })
  assert.equal(buyerReg.status, 201)
  const buyer = (await buyerReg.json()) as AuthBody
  const buyerRes = await guardServer.request('/test/producer', bearer(buyer.token))
  await expectError(buyerRes, 403, 'PRODUCER_NOT_APPROVED')

  const goneEmail = uniqueEmail('approval.gone')
  const goneReg = await register({
    name: 'Gone Producer',
    email: goneEmail,
    password: PASSWORD,
    role: 'producer',
    farmName: 'Gone Farm',
    locality: 'Faro',
  })
  assert.equal(goneReg.status, 201)
  const gone = (await goneReg.json()) as AuthBody
  await UserModel.deleteOne({ _id: gone.user.id })
  const deleted = await guardServer.request('/test/producer', bearer(gone.token))
  await expectError(deleted, 403, 'PRODUCER_NOT_APPROVED')
})

test('the 11th login request within a minute returns 429 TOO_MANY_REQUESTS without fields', async () => {
  const email = uniqueEmail('limited')

  const first = await login({ email, password: PASSWORD })
  assert.equal(first.status, 401)
  // Proves the limiter keys local requests as 127.0.0.1 after IPv6 normalisation.
  const firstHit = await authLimiter.getKey('127.0.0.1')
  assert.equal(firstHit?.totalHits, 1)

  for (let attempt = 1; attempt < 10; attempt += 1) {
    const res = await login({ email, password: PASSWORD })
    assert.equal(res.status, 401)
  }

  const limited = await login({ email, password: PASSWORD })
  assert.equal(limited.status, 429)
  const body = (await readError(limited)) as ErrorBody
  assert.deepEqual(body, { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, slow down' } })
  assert.equal('fields' in body.error, false)

  for (const key of LIMITER_KEYS) await authLimiter.resetKey(key)
  assert.equal(await authLimiter.getKey('127.0.0.1'), undefined)
  const afterReset = await login({ email, password: PASSWORD })
  assert.equal(afterReset.status, 401)
  const afterResetHit = await authLimiter.getKey('127.0.0.1')
  assert.equal(afterResetHit?.totalHits, 1)
})
