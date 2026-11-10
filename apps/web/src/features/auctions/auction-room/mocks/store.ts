import type { AuctionBidDto, AuctionLeaderDto, AuctionRoomDto } from '../auction-room.dto'
import { createMockAuctionRooms } from './auctions'

export type MockAuctionEvent =
  | {
      type: 'bid-placed'
      auctionId: string
      bid: AuctionBidDto
      currentPrice: number
      leader: AuctionLeaderDto | null
      endsAt: string | undefined
    }
  | { type: 'viewers'; auctionId: string; count: number }
  | {
      type: 'auction-ended'
      auctionId: string
      winner: AuctionLeaderDto | null
      currentPrice: number
    }
  | {
      type: 'bid-rejected'
      auctionId: string
      bidderId: string
      amount: number
      code: string
      message: string
    }

type Listener = (event: MockAuctionEvent) => void

let rooms: Record<string, AuctionRoomDto> | null = null
const listeners = new Set<Listener>()

function seed(): Record<string, AuctionRoomDto> {
  if (!rooms) rooms = createMockAuctionRooms()
  return rooms
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function emit(event: MockAuctionEvent): void {
  listeners.forEach((listener) => listener(event))
}

export function subscribeMockAuctionEvents(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getMockAuction(id: string): AuctionRoomDto | null {
  const room = seed()[id]
  return room ? clone(room) : null
}

export function addMockBid(
  id: string,
  bid: AuctionBidDto,
  leader: AuctionLeaderDto,
): AuctionRoomDto | null {
  const room = seed()[id]
  if (!room) return null

  room.bids = [...(room.bids ?? []), bid]
  room.currentPrice = bid.amount ?? room.currentPrice
  room.leader = leader

  emit({
    type: 'bid-placed',
    auctionId: id,
    bid,
    currentPrice: room.currentPrice ?? 0,
    leader,
    endsAt: room.endsAt,
  })

  return clone(room)
}

export function setMockViewers(id: string, count: number): void {
  const room = seed()[id]
  if (!room) return

  const next = Math.max(0, count)
  room.viewerCount = next
  emit({ type: 'viewers', auctionId: id, count: next })
}

export function endMockAuction(id: string): void {
  const room = seed()[id]
  if (!room || room.status === 'ended') return

  room.status = 'ended'
  room.winner = room.leader ?? null

  emit({
    type: 'auction-ended',
    auctionId: id,
    winner: room.winner ?? null,
    currentPrice: room.currentPrice ?? 0,
  })
}

export function emitMockBidRejected(
  id: string,
  bidderId: string,
  amount: number,
  code: string,
  message: string,
): void {
  emit({ type: 'bid-rejected', auctionId: id, bidderId, amount, code, message })
}
