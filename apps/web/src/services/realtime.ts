import { io, type Socket } from 'socket.io-client'
import { getToken, reportSessionExpired } from './api'
import { USE_MOCKS } from './env'

export type RealtimeHandler<T = unknown> = (payload: T) => void

export interface RealtimeClient {
  connect(): void
  disconnect(): void
  join(room: string): void
  leave(room: string): void
  on<T = unknown>(event: string, handler: RealtimeHandler<T>): () => void
}

export const userRoom = (id: string) => `user:${id}`
export const auctionRoom = (id: string) => `auction:${id}`

const ORDER_STATES = ['confirmed', 'ready', 'delivered'] as const

class MockRealtimeClient implements RealtimeClient {
  private handlers = new Map<string, Set<RealtimeHandler>>()
  private rooms = new Set<string>()
  private timer: ReturnType<typeof setInterval> | null = null
  private connected = false
  private tick = 0

  connect(): void {
    if (this.connected) return
    this.connected = true
    this.timer = setInterval(() => this.emitTick(), 12000)
  }

  disconnect(): void {
    this.connected = false
    this.rooms.clear()
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  join(room: string): void {
    this.rooms.add(room)
    this.connect()
  }

  leave(room: string): void {
    this.rooms.delete(room)
  }

  on<T = unknown>(event: string, handler: RealtimeHandler<T>): () => void {
    const set = this.handlers.get(event) ?? new Set<RealtimeHandler>()
    set.add(handler as RealtimeHandler)
    this.handlers.set(event, set)
    return () => {
      set.delete(handler as RealtimeHandler)
    }
  }

  private emitTick(): void {
    this.tick += 1
    const now = Date.now()
    for (const room of this.rooms) {
      if (room.startsWith('user:')) {
        this.emit('order-updated', {
          room,
          orderId: `order-${this.tick}`,
          status: ORDER_STATES[this.tick % ORDER_STATES.length],
          updatedAt: new Date(now).toISOString(),
        })
      } else if (room.startsWith('auction:')) {
        this.emit('auction-updated', {
          room,
          auctionId: room.slice('auction:'.length),
          currentPrice: 5 + this.tick,
          bidCount: this.tick,
          leader: null,
          endsAt: new Date(now + 60_000).toISOString(),
          status: 'active',
        })
      }
    }
  }

  private emit(event: string, payload: unknown): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload))
  }
}

// Real Socket.io transport. The server reads the JWT from the handshake, so a
// signed-in browser joins `user:<id>` automatically and can ask for auction rooms.
class SocketRealtimeClient implements RealtimeClient {
  private socket: Socket | null = null
  private authToken = ''
  private readonly rooms = new Set<string>()
  private readonly handlers = new Map<string, Set<RealtimeHandler>>()

  connect(): void {
    const token = getToken() ?? ''

    if (this.socket) {
      // A different user (or a fresh login) needs a new handshake, not the old room set.
      if (token === this.authToken) {
        if (!this.socket.connected) this.socket.connect()
        return
      }
      this.closeSocket()
    }

    this.authToken = token
    const socket = io({
      auth: { token },
      autoConnect: false,
    })
    this.socket = socket

    for (const [event, handlers] of this.handlers) {
      for (const handler of handlers) socket.on(event, handler as (...args: unknown[]) => void)
    }

    // Rooms live on the server connection, so they must be rejoined after a reconnect.
    socket.on('connect', () => {
      for (const room of this.rooms) socket.emit('join', { room })
    })

    socket.on('connect_error', (error) => {
      if (token && error.message === 'UNAUTHORIZED') reportSessionExpired()
    })

    socket.connect()
  }

  join(room: string): void {
    this.rooms.add(room)
    this.connect()
    if (this.socket?.connected) this.socket.emit('join', { room })
  }

  leave(room: string): void {
    this.rooms.delete(room)
    if (this.socket?.connected) this.socket.emit('leave', { room })
  }

  on<T = unknown>(event: string, handler: RealtimeHandler<T>): () => void {
    const set = this.handlers.get(event) ?? new Set<RealtimeHandler>()
    set.add(handler as RealtimeHandler)
    this.handlers.set(event, set)
    this.socket?.on(event, handler as (...args: unknown[]) => void)

    return () => {
      set.delete(handler as RealtimeHandler)
      if (set.size === 0) this.handlers.delete(event)
      this.socket?.off(event, handler as (...args: unknown[]) => void)
    }
  }

  disconnect(): void {
    this.rooms.clear()
    this.closeSocket()
  }

  private closeSocket(): void {
    const socket = this.socket
    this.socket = null
    this.authToken = ''
    if (!socket) return
    socket.disconnect()
  }
}

export function createRealtimeClient(): RealtimeClient {
  return USE_MOCKS ? new MockRealtimeClient() : new SocketRealtimeClient()
}
