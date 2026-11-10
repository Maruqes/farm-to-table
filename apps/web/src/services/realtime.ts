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
    for (const room of this.rooms) {
      if (room.startsWith('user:')) {
        this.emit('order-updated', {
          room,
          orderId: `order-${this.tick}`,
          status: ORDER_STATES[this.tick % ORDER_STATES.length],
        })
      } else if (room.startsWith('auction:')) {
        this.emit('auction-updated', {
          room,
          auctionId: room.slice('auction:'.length),
          currentPrice: 5 + this.tick,
          bidCount: this.tick,
        })
      }
    }
  }

  private emit(event: string, payload: unknown): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload))
  }
}

// Placeholder until the API exposes Socket.io (see SCOPE.md §3/§4).
class SocketRealtimeClient implements RealtimeClient {
  connect(): void {}
  disconnect(): void {}
  join(_room: string): void {}
  leave(_room: string): void {}
  on<T = unknown>(_event: string, _handler: RealtimeHandler<T>): () => void {
    return () => {}
  }
}

export function createRealtimeClient(): RealtimeClient {
  return USE_MOCKS ? new MockRealtimeClient() : new SocketRealtimeClient()
}
