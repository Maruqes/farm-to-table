import jwt from 'jsonwebtoken'
import type { Server } from 'socket.io'
import { env } from '../config/env.js'
import { setIo, viewerCount } from './emit.js'

const AUCTION_ROOM = /^auction:[0-9a-f]{24}$/i

function roomOf(payload: unknown): string | null {
  const room = (payload as { room?: unknown } | null | undefined)?.room
  return typeof room === 'string' && AUCTION_ROOM.test(room) ? room : null
}

export function attach(io: Server): void {
  setIo(io)

  io.use((socket, next) => {
    const token = (socket.handshake.auth as { token?: unknown } | undefined)?.token
    if (token === undefined || token === null || token === '') {
      next()
      return
    }
    try {
      if (typeof token !== 'string') throw new Error('bad token')
      const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] }) as { sub?: unknown }
      if (typeof payload.sub !== 'string' || !payload.sub) throw new Error('bad token')
      socket.data.userId = payload.sub
      next()
    } catch {
      next(new Error('UNAUTHORIZED'))
    }
  })

  io.on('connection', (socket) => {
    if (socket.data.userId) void socket.join(`user:${socket.data.userId}`)

    const announce = (room: string, count: number): void => {
      io.to(room).emit('viewers', { auctionId: room.slice('auction:'.length), count })
    }

    socket.on('join', async (payload: unknown) => {
      const room = roomOf(payload)
      if (!room) return
      await socket.join(room)
      announce(room, viewerCount(room.slice('auction:'.length)))
    })

    socket.on('leave', async (payload: unknown) => {
      const room = roomOf(payload)
      if (!room) return
      await socket.leave(room)
      announce(room, viewerCount(room.slice('auction:'.length)))
    })

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (AUCTION_ROOM.test(room)) announce(room, viewerCount(room.slice('auction:'.length)) - 1)
      }
    })
  })
}
