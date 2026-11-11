import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { Server as HttpServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { after, before, test } from 'node:test'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { io as connectClient } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { env } from '../config/env.js'
import { connectedSockets, emitToUser, viewerCount } from './emit.js'
import { attach } from './socket.js'

const A = 'a'.repeat(24)
const B = 'b'.repeat(24)
const AUCTION = 'c'.repeat(24)
const ROOM = `auction:${AUCTION}`

let http: HttpServer
let ioServer: Server
let url = ''
const open: Socket[] = []

const sign = (sub: string, opts: jwt.SignOptions = {}): string =>
  jwt.sign({ sub, role: 'customer' }, env.jwtSecret, { algorithm: 'HS256', expiresIn: '1h', ...opts })

const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

function client(token?: string): Promise<Socket> {
  const s = connectClient(url, { auth: token === undefined ? {} : { token }, forceNew: true, reconnection: false })
  open.push(s)
  return new Promise((resolve, reject) => {
    s.once('connect', () => resolve(s))
    s.once('connect_error', reject)
  })
}

function collect(s: Socket, event: string): unknown[] {
  const got: unknown[] = []
  s.on(event, (p) => got.push(p))
  return got
}

before(async () => {
  http = createServer()
  ioServer = new Server(http)
  attach(ioServer)
  await new Promise<void>((r) => http.listen(0, r))
  url = `http://127.0.0.1:${(http.address() as AddressInfo).port}`
})

after(async () => {
  for (const s of open) s.close()
  await ioServer.close()
})

test('emitToUser reaches only the matching user', async () => {
  const a = await client(sign(A))
  const b = await client(sign(B))
  const gotA = collect(a, 'ping')
  const gotB = collect(b, 'ping')
  emitToUser(A, 'ping', { n: 1 })
  await wait(100)
  assert.deepEqual(gotA, [{ n: 1 }])
  assert.deepEqual(gotB, [])
})

test('joining another user room is ignored', async () => {
  const a = await client(sign(A))
  const b = await client(sign(B))
  const gotA = collect(a, 'secret')
  a.emit('join', { room: `user:${B}` })
  await wait(100)
  emitToUser(B, 'secret', 1)
  await wait(100)
  assert.deepEqual(gotA, [])
  void b
})

test('viewers goes 1 -> 2 -> 1', async () => {
  const a = await client()
  const b = await client()
  const counts: number[] = []
  a.on('viewers', (p: { auctionId: string; count: number }) => {
    assert.equal(p.auctionId, AUCTION)
    counts.push(p.count)
  })
  a.emit('join', { room: ROOM })
  await wait(100)
  b.emit('join', { room: ROOM })
  await wait(100)
  b.close()
  await wait(150)
  assert.deepEqual(counts, [1, 2, 1])
  assert.equal(viewerCount(AUCTION), 1)
})

test('bad token is rejected, missing token is a visitor', async () => {
  await assert.rejects(client('garbage'), /UNAUTHORIZED/)
  const expired = sign(A, { expiresIn: -10 })
  await assert.rejects(client(expired), /UNAUTHORIZED/)
  const visitor = await client()
  assert.ok(visitor.connected)
})

test('malformed join payloads are ignored', async () => {
  const s = await client()
  const before = viewerCount('d'.repeat(24))
  for (const p of [null, undefined, { room: 5 }, 'auction:xyz', { room: 'auction:xyz' }, { room: 'user:x' }]) {
    s.emit('join', p)
    s.emit('leave', p)
  }
  await wait(150)
  assert.ok(s.connected)
  assert.equal(viewerCount('d'.repeat(24)), before)
  assert.equal(ioServer.sockets.adapter.rooms.has('auction:xyz'), false)
})

test('connectedSockets counts live sockets', async () => {
  await wait(100)
  const base = connectedSockets()
  const s = await client()
  assert.equal(connectedSockets(), base + 1)
  s.close()
  await wait(100)
  assert.equal(connectedSockets(), base)
})
