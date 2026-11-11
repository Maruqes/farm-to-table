import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import type { Express } from 'express'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { UserModel, type CardEmbedded, type ProducerEmbedded, type UserRole } from './users.model.js'
import { chargeCard } from './users.service.js'

interface ErrorBody {
  error: { code: string; message: string; fields?: Record<string, string> }
}

interface CardBody {
  last4: string
  holder: string
  expiry: string
  simulateInvalid: boolean
}

interface ProfileBody {
  id: string
  name: string
  email: string
  address: string
  card: CardBody | null
}

interface TestServer {
  request: (path: string, init?: RequestInit) => Promise<Response>
  close: () => Promise<void>
}

interface TestUser {
  id: string
  email: string
  token: string
}

interface CreateUserOptions {
  role?: UserRole
  name?: string
  email?: string
  address?: string
  card?: CardEmbedded | null
  producer?: Partial<ProducerEmbedded>
}

const VALID_NUMBER = '4111 1111 1111 1111'
const STRIPPED_NUMBER = '4111111111111111'
const FUTURE_EXPIRY = '12/35'

function validCardBody(): Record<string, unknown> {
  return { number: VALID_NUMBER, holder: 'Ana Silva', expiry: FUTURE_EXPIRY, simulateInvalid: false }
}

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

before(async () => {
  await connect()
  await mongoose.connection.dropDatabase()
  // dropDatabase() also drops the unique email index; rebuild it so duplicate
  // emails are still rejected by Mongo as well as by the service pre-check.
  await UserModel.syncIndexes()
  testServer = await startServer(app)
})

after(async () => {
  await testServer.close()
  await disconnect()
})

let emailCounter = 0

function uniqueEmail(prefix: string): string {
  emailCounter += 1
  return `${prefix}.${emailCounter}@example.com`
}

function signToken(sub: string, role: UserRole): string {
  return jwt.sign({ sub, role }, env.jwtSecret, { expiresIn: '2h', algorithm: 'HS256' })
}

async function createUser(options: CreateUserOptions = {}): Promise<TestUser> {
  const role = options.role ?? 'buyer'
  const email = options.email ?? uniqueEmail(role)
  const doc = await UserModel.create({
    name: options.name ?? 'Test User',
    email,
    passwordHash: 'unused-in-users-tests',
    role,
    address: options.address ?? '',
    ...(options.card !== undefined ? { card: options.card } : {}),
    ...(options.producer !== undefined ? { producer: options.producer } : {}),
  })
  const id = String(doc._id)
  return { id, email, token: signToken(id, role) }
}

function apiRequest(path: string, method: string, token?: string, body?: unknown): Promise<Response> {
  const headers: Record<string, string> = {}
  if (token !== undefined) headers.authorization = `Bearer ${token}`
  const init: RequestInit = { method, headers }
  if (body !== undefined) {
    headers['content-type'] = 'application/json'
    init.body = JSON.stringify(body)
  }
  return testServer.request(path, init)
}

function getMe(token?: string): Promise<Response> {
  return apiRequest('/api/users/me', 'GET', token)
}

function putMe(token: string, body: unknown): Promise<Response> {
  return apiRequest('/api/users/me', 'PUT', token, body)
}

function putCard(token: string, body: unknown): Promise<Response> {
  return apiRequest('/api/users/me/card', 'PUT', token, body)
}

async function readProfile(res: Response): Promise<ProfileBody> {
  return (await res.json()) as ProfileBody
}

async function expectError(res: Response, status: number, code: string): Promise<ErrorBody> {
  assert.equal(res.status, status)
  const body = (await res.json()) as ErrorBody
  assert.equal(body.error.code, code)
  assert.equal(typeof body.error.message, 'string')
  return body
}

test('profile endpoints reject requests without a bearer token', async () => {
  for (const [method, path] of [
    ['GET', '/api/users/me'],
    ['PUT', '/api/users/me'],
    ['PUT', '/api/users/me/card'],
  ] as const) {
    const res = await apiRequest(path, method, undefined, method === 'GET' ? undefined : {})
    await expectError(res, 401, 'UNAUTHORIZED')
  }
})

test('admin cannot read a profile and only buyers can save a card', async () => {
  const admin = await createUser({ role: 'admin', name: 'Admin User' })
  const producer = await createUser({
    role: 'producer',
    name: 'Producer User',
    producer: { farmName: 'Quinta do Vale', status: 'approved' },
  })

  await expectError(await getMe(admin.token), 403, 'FORBIDDEN')
  await expectError(await putMe(admin.token, { name: 'Admin User', email: admin.email, address: '' }), 403, 'FORBIDDEN')

  await expectError(await putCard(producer.token, validCardBody()), 403, 'FORBIDDEN')
  await expectError(await putCard(admin.token, validCardBody()), 403, 'FORBIDDEN')
})

test('GET /me returns the Profile shape with a null card', async () => {
  const buyer = await createUser({ role: 'buyer', name: 'Ana Buyer', address: '' })
  const res = await getMe(buyer.token)
  assert.equal(res.status, 200)

  const profile = await readProfile(res)
  assert.deepEqual(Object.keys(profile).sort(), ['address', 'card', 'email', 'id', 'name'])
  assert.equal(profile.id, buyer.id)
  assert.equal(profile.name, 'Ana Buyer')
  assert.equal(profile.email, buyer.email)
  assert.equal(profile.address, '')
  assert.equal(profile.card, null)
})

test('PUT /me updates name, email and address and ignores role, producer and card', async () => {
  const buyer = await createUser({ role: 'buyer', name: 'Old Name', address: 'Old address' })
  const newEmail = uniqueEmail('updated')

  const res = await putMe(buyer.token, {
    name: 'New Name',
    email: newEmail.toUpperCase(),
    address: 'Rua Nova 12',
    role: 'admin',
    producer: { farmName: 'Injected Farm', status: 'approved' },
    card: { last4: '9999', holder: 'Injected', expiry: FUTURE_EXPIRY, simulateInvalid: false },
  })
  assert.equal(res.status, 200)

  const profile = await readProfile(res)
  assert.equal(profile.id, buyer.id)
  assert.equal(profile.name, 'New Name')
  assert.equal(profile.email, newEmail)
  assert.equal(profile.address, 'Rua Nova 12')
  assert.equal(profile.card, null)

  const doc = await UserModel.findById(buyer.id)
  assert.ok(doc)
  assert.equal(doc.name, 'New Name')
  assert.equal(doc.email, newEmail)
  assert.equal(doc.address, 'Rua Nova 12')
  assert.equal(doc.role, 'buyer')
  assert.equal(doc.producer, undefined)
  assert.equal(doc.card, null)
})

test('PUT /me rejects an email owned by another user with fields.email', async () => {
  const owner = await createUser({ name: 'Email Owner' })
  const other = await createUser({ name: 'Email Other' })

  const res = await putMe(other.token, {
    name: 'Email Other',
    email: owner.email.toUpperCase(),
    address: '',
  })
  const body = await expectError(res, 400, 'VALIDATION_ERROR')
  assert.deepEqual(body.error.fields, { email: 'Already registered' })

  const unchanged = await UserModel.findById(other.id)
  assert.equal(unchanged?.email, other.email)

  const ownEmail = await putMe(other.token, { name: 'Email Other', email: other.email, address: '' })
  assert.equal(ownEmail.status, 200)
})

test('PUT /me/card strips spaces, saves the last4 and never stores the full number', async () => {
  const buyer = await createUser({ role: 'buyer', name: 'Card Buyer' })

  const res = await putCard(buyer.token, validCardBody())
  assert.equal(res.status, 200)

  const profile = await readProfile(res)
  assert.deepEqual(profile.card, {
    last4: '1111',
    holder: 'Ana Silva',
    expiry: FUTURE_EXPIRY,
    simulateInvalid: false,
  })

  const raw = await UserModel.collection.findOne({ email: buyer.email })
  assert.ok(raw)
  const serialised = JSON.stringify(raw)
  assert.equal(serialised.includes(STRIPPED_NUMBER), false)
  assert.equal(serialised.includes(VALID_NUMBER), false)

  const storedCard = (raw as unknown as { card: Record<string, unknown> }).card
  assert.deepEqual(Object.keys(storedCard).sort(), ['expiry', 'holder', 'last4', 'simulateInvalid'])
  assert.equal(storedCard.last4, '1111')
  assert.equal(storedCard.holder, 'Ana Silva')
  assert.equal(storedCard.expiry, FUTURE_EXPIRY)
  assert.equal(storedCard.simulateInvalid, false)
})

test('PUT /me/card reports number, expiry and holder errors and keeps the saved card null', async () => {
  const buyer = await createUser({ role: 'buyer', name: 'Invalid Card Buyer' })

  const badNumber = await putCard(buyer.token, { ...validCardBody(), number: '4111 1111 1111 1112' })
  const badNumberBody = await expectError(badNumber, 400, 'VALIDATION_ERROR')
  assert.deepEqual(badNumberBody.error.fields, { number: 'Invalid card number' })

  const badMonth = await putCard(buyer.token, { ...validCardBody(), expiry: '13/30' })
  const badMonthBody = await expectError(badMonth, 400, 'VALIDATION_ERROR')
  assert.deepEqual(badMonthBody.error.fields, { expiry: 'Invalid or expired expiry' })

  const pastExpiry = await putCard(buyer.token, { ...validCardBody(), expiry: '01/20' })
  const pastExpiryBody = await expectError(pastExpiry, 400, 'VALIDATION_ERROR')
  assert.deepEqual(pastExpiryBody.error.fields, { expiry: 'Invalid or expired expiry' })

  const emptyHolder = await putCard(buyer.token, { ...validCardBody(), holder: '   ' })
  const emptyHolderBody = await expectError(emptyHolder, 400, 'VALIDATION_ERROR')
  assert.deepEqual(emptyHolderBody.error.fields, { holder: 'Card holder is required' })

  const doc = await UserModel.findById(buyer.id)
  assert.equal(doc?.card, null)
})

test('a producer profile always exposes card as null, even when a card is stored', async () => {
  const producer = await createUser({
    role: 'producer',
    name: 'Producer Profile',
    producer: { farmName: 'Horta Nova', status: 'approved' },
    card: { last4: '1111', holder: 'Stored Holder', expiry: FUTURE_EXPIRY, simulateInvalid: false },
  })

  const res = await getMe(producer.token)
  assert.equal(res.status, 200)
  const profile = await readProfile(res)
  assert.equal(profile.card, null)

  const updated = await putMe(producer.token, {
    name: 'Producer Renamed',
    email: producer.email,
    address: 'Rua do Campo',
  })
  assert.equal(updated.status, 200)
  const updatedProfile = await readProfile(updated)
  assert.equal(updatedProfile.name, 'Producer Renamed')
  assert.equal(updatedProfile.address, 'Rua do Campo')
  assert.equal(updatedProfile.card, null)
})

test('chargeCard succeeds only for an existing, non-expired, non-invalid card', async () => {
  const valid = await createUser({
    card: { last4: '1111', holder: 'Valid Holder', expiry: FUTURE_EXPIRY, simulateInvalid: false },
  })
  const noCard = await createUser({})
  const simulateInvalid = await createUser({
    card: { last4: '1111', holder: 'Invalid Holder', expiry: FUTURE_EXPIRY, simulateInvalid: true },
  })
  const expired = await createUser({
    card: { last4: '1111', holder: 'Expired Holder', expiry: '01/20', simulateInvalid: false },
  })

  assert.equal(await chargeCard(valid.id), true)
  assert.equal(await chargeCard(noCard.id), false)
  assert.equal(await chargeCard(simulateInvalid.id), false)
  assert.equal(await chargeCard(expired.id), false)
  assert.equal(await chargeCard(new mongoose.Types.ObjectId().toString()), false)
})
