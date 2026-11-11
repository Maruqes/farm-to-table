import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { app } from '../../app.js'
import { env } from '../../config/env.js'
import { connect, disconnect } from '../../db/connect.js'
import { UserModel, type ProducerEmbedded, type UserRole } from '../users/users.model.js'
import { setStorageClientForTests } from '../../lib/storage.js'
import { ProductModel } from './products.model.js'

let server: Server
let baseUrl = ''
let counter = 0

const store = new Map<string, { body: Buffer; type?: string }>()

before(async () => {
  setStorageClientForTests({
    async send(cmd: any) {
      const name = cmd.constructor.name
      const key = cmd.input?.Key
      if (name === 'PutObjectCommand') { store.set(key, { body: Buffer.from(cmd.input.Body), type: cmd.input.ContentType }); return {} }
      if (name === 'GetObjectCommand') {
        const o = store.get(key)
        if (!o) throw Object.assign(new Error('NoSuchKey'), { name: 'NoSuchKey' })
        return { Body: { transformToByteArray: async () => new Uint8Array(o.body) }, ContentType: o.type }
      }
      if (name === 'DeleteObjectCommand') { store.delete(key); return {} }
      return {}
    },
  })
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
  setStorageClientForTests(null)
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


const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('tiny-png-body')])
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('tiny-jpeg-body')])
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x10, 0, 0, 0]), Buffer.from('WEBPVP8 tiny')])

async function upload(id: string, token: string | undefined, file?: { data: Buffer | string; name: string; type?: string }, field = 'image') {
  const form = new FormData()
  if (file) form.append(field, new Blob([file.data as any], { type: file.type ?? 'image/png' }), file.name)
  const res = await fetch(`${baseUrl}/api/products/${id}/image`, {
    method: 'POST',
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: form,
  })
  const text = await res.text()
  return { status: res.status, body: (text ? JSON.parse(text) : null) as any }
}

async function getImage(id: string) {
  const res = await fetch(`${baseUrl}/api/products/${id}/image`)
  return { status: res.status, type: res.headers.get('content-type'), cache: res.headers.get('cache-control'), bytes: Buffer.from(await res.arrayBuffer()) }
}

const valid = { name: 'Wild honey', category: 'honey', price: 7.5, unit: 'jar', stock: 4, season: 'all-year', organic: true }
const newProduct = async (token: string) => (await call('/api/products', 'POST', token, valid)).body.id as string

test('upload then GET returns identical bytes and content type for png, jpeg, webp', async () => {
  const me = await producer('Img Farm')
  for (const [file, type, name] of [[PNG, 'image/png', 'a.png'], [JPEG, 'image/jpeg', 'a.jpg'], [WEBP, 'image/webp', 'a.webp']] as const) {
    const id = await newProduct(me.token)
    const up = await upload(id, me.token, { data: file, name })
    assert.equal(up.status, 200)
    assert.match(up.body.imageUrl, new RegExp(`^/api/products/${id}/image\\?v=\\d+$`))
    const got = await getImage(id)
    assert.equal(got.status, 200)
    assert.match(got.type ?? '', new RegExp(type))
    assert.ok(got.cache)
    assert.ok(got.bytes.equals(file))
  }
})

test('product detail imageUrl format after upload', async () => {
  const me = await producer('Img Detail Farm')
  const id = await newProduct(me.token)
  await upload(id, me.token, { data: PNG, name: 'a.png' })
  const res = await call(`/api/products/${id}`)
  assert.match(res.body.imageUrl, new RegExp(`^/api/products/${id}/image\\?v=\\d+$`))
})

test('HTML or SVG content named .png is rejected and nothing is stored', async () => {
  const me = await producer('Img Bad Farm')
  const id = await newProduct(me.token)
  const before = store.size
  for (const data of ['<html><script>alert(1)</script></html>', '<svg xmlns="http://www.w3.org/2000/svg"></svg>']) {
    const res = await upload(id, me.token, { data, name: 'evil.png', type: 'image/png' })
    assert.equal(res.status, 400)
    assert.ok(res.body.error.fields?.image ?? res.body.error.details?.image ?? res.body.fields?.image)
  }
  assert.equal(store.size, before)
  assert.equal((await getImage(id)).status, 404)
})

test('6 MB file is rejected and nothing is stored', async () => {
  const me = await producer('Img Big Farm')
  const id = await newProduct(me.token)
  const before = store.size
  const res = await upload(id, me.token, { data: Buffer.concat([PNG, Buffer.alloc(6 * 1024 * 1024)]), name: 'big.png' })
  assert.equal(res.status, 400)
  assert.ok(res.body.error.fields?.image ?? res.body.error.details?.image ?? res.body.fields?.image)
  assert.equal(store.size, before)
})

test('no file, or wrong field name: 400', async () => {
  const me = await producer('Img None Farm')
  const id = await newProduct(me.token)
  assert.equal((await upload(id, me.token)).status, 400)
  assert.equal((await upload(id, me.token, { data: PNG, name: 'a.png' }, 'file')).status, 400)
})

test('other producer 403 and nothing stored; buyer 403; no token 401; unknown id 404', async () => {
  const me = await producer('Img Owner')
  const other = await producer('Img Other')
  const buyer = await createUser('buyer', 'Img Buyer')
  const id = await newProduct(me.token)
  const before = store.size
  const f = { data: PNG, name: 'a.png' }
  assert.equal((await upload(id, other.token, f)).status, 403)
  assert.equal((await upload(id, buyer.token, f)).status, 403)
  assert.equal((await upload(id, undefined, f)).status, 401)
  assert.equal(store.size, before)
  assert.equal((await upload(String(new mongoose.Types.ObjectId()), me.token, f)).status, 404)
})

test('replacing deletes the old object; deleting the product deletes its object', async () => {
  const me = await producer('Img Replace Farm')
  const id = await newProduct(me.token)
  const base = store.size
  await upload(id, me.token, { data: PNG, name: 'a.png' })
  assert.equal(store.size, base + 1)
  await upload(id, me.token, { data: JPEG, name: 'b.jpg' })
  assert.equal(store.size, base + 1)
  assert.ok((await getImage(id)).bytes.equals(JPEG))
  assert.equal((await call(`/api/products/${id}`, 'DELETE', me.token)).status, 204)
  assert.equal(store.size, base)
})

test('GET image: product without image 404, unknown id 404', async () => {
  const me = await producer('Img Empty Farm')
  const id = await newProduct(me.token)
  assert.equal((await getImage(id)).status, 404)
  assert.equal((await getImage(String(new mongoose.Types.ObjectId()))).status, 404)
})
