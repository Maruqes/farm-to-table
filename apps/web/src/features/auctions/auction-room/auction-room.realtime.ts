import { USE_MOCKS } from '@/services/env'
import { auctionRoom, createRealtimeClient } from '@/services/realtime'
import type {
  AuctionBidDto,
  AuctionEndedEventDto,
  BidPlacedEventDto,
  BidRejectedEventDto,
  ViewersEventDto,
} from './auction-room.dto'
import type { AuctionStatus } from './auction-room.types'
import {
  addMockBid,
  endMockAuction,
  getMockAuction,
  setMockViewers,
  subscribeMockAuctionEvents,
} from './mocks/store'

// Real time behind a small client interface: the mock joins the room, emits viewers,
// rival bids and the ending on timers; the socket implementation listens on the room.

export interface AuctionRoomRealtimeContext {
  auctionId: string
  token: string | null
  userId: string
  status: AuctionStatus
  endsAt: string | null
}

export interface AuctionRoomRealtimeHandlers {
  onBidPlaced: (dto: BidPlacedEventDto) => void
  onViewers: (dto: ViewersEventDto) => void
  onEnded: (dto: AuctionEndedEventDto) => void
  onBidRejected: (dto: BidRejectedEventDto) => void
}

export interface AuctionRoomRealtime {
  subscribe(context: AuctionRoomRealtimeContext, handlers: AuctionRoomRealtimeHandlers): () => void
}

const COMPETING_BIDDERS = [
  { id: 'buyer-marta', name: 'Marta Nunes' },
  { id: 'buyer-tomas', name: 'Tomás Rocha' },
  { id: 'buyer-ines', name: 'Inês Costa' },
  { id: 'buyer-rui', name: 'Rui Almeida' },
]

const FIRST_VIEWERS_MS = 600
const VIEWERS_INTERVAL_MS = 16000
const FIRST_BID_MS = 8000
const BID_INTERVAL_MS = 14000

function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100
}

function subscribeMock(
  context: AuctionRoomRealtimeContext,
  handlers: AuctionRoomRealtimeHandlers,
): () => void {
  const { auctionId, status, endsAt } = context
  const room = getMockAuction(auctionId)
  if (!room) return () => {}

  const stoppers: Array<() => void> = []
  let bidSequence = 0
  let viewerTick = 0

  const later = (fn: () => void, ms: number) => {
    const timer = setTimeout(fn, ms)
    stoppers.push(() => clearTimeout(timer))
  }

  const every = (fn: () => void, ms: number) => {
    const timer = setInterval(fn, ms)
    stoppers.push(() => clearInterval(timer))
  }

  const unsubscribeEvents = subscribeMockAuctionEvents((event) => {
    if (event.auctionId !== auctionId) return

    switch (event.type) {
      case 'bid-placed':
        handlers.onBidPlaced({
          auctionId,
          bid: event.bid,
          currentPrice: event.currentPrice,
          leader: event.leader,
          endsAt: event.endsAt,
        })
        break
      case 'viewers':
        handlers.onViewers({ auctionId, count: event.count })
        break
      case 'auction-ended':
        handlers.onEnded({
          auctionId,
          status: 'ended',
          winner: event.winner,
          currentPrice: event.currentPrice,
        })
        break
      case 'bid-rejected':
        handlers.onBidRejected({
          auctionId,
          bidderId: event.bidderId,
          amount: event.amount,
          code: event.code,
          message: event.message,
        })
        break
    }
  })

  const placeRivalBid = () => {
    const current = getMockAuction(auctionId)
    if (!current || current.status !== 'active') return
    if (current.endsAt && Date.parse(current.endsAt) <= Date.now()) return

    bidSequence += 1
    const bidder = COMPETING_BIDDERS[bidSequence % COMPETING_BIDDERS.length]
    const increment = current.increment ?? 1
    const amount = roundMoney(
      (current.currentPrice ?? 0) + increment * (1 + (bidSequence % 2)),
    )
    const bid: AuctionBidDto = {
      id: `bid-${auctionId}-live-${bidSequence}`,
      amount,
      name: bidder.name,
      bidderId: bidder.id,
      date: new Date().toISOString(),
    }

    addMockBid(auctionId, bid, bidder)
  }

  if (status === 'active') {
    later(() => setMockViewers(auctionId, (room.viewerCount ?? 0) + 1), FIRST_VIEWERS_MS)

    every(() => {
      const current = getMockAuction(auctionId)
      if (!current) return
      viewerTick += 1
      const drift = viewerTick % 2 === 0 ? 1 : -1
      setMockViewers(auctionId, Math.max(0, (current.viewerCount ?? 0) + drift))
    }, VIEWERS_INTERVAL_MS)

    later(() => {
      placeRivalBid()
      every(placeRivalBid, BID_INTERVAL_MS)
    }, FIRST_BID_MS)

    if (endsAt) {
      const delay = Date.parse(endsAt) - Date.now()
      if (!Number.isNaN(delay)) {
        later(() => endMockAuction(auctionId), Math.max(1000, delay))
      }
    }
  }

  return () => {
    stoppers.forEach((stop) => stop())
    unsubscribeEvents()
  }
}

function subscribeSocket(
  context: AuctionRoomRealtimeContext,
  handlers: AuctionRoomRealtimeHandlers,
): () => void {
  const client = createRealtimeClient()
  const room = auctionRoom(context.auctionId)

  client.connect()
  client.join(room)

  const unsubscribers = [
    client.on<BidPlacedEventDto>('bid-placed', handlers.onBidPlaced),
    client.on<ViewersEventDto>('viewers', handlers.onViewers),
    client.on<AuctionEndedEventDto>('auction-ended', handlers.onEnded),
    client.on<BidRejectedEventDto>('bid-rejected', handlers.onBidRejected),
  ]

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe())
    client.leave(room)
    client.disconnect()
  }
}

export function createAuctionRoomRealtime(): AuctionRoomRealtime {
  return { subscribe: USE_MOCKS ? subscribeMock : subscribeSocket }
}
