// Domain model consumed by components and hooks. API shapes stay in auction-room.dto.ts.

export type AuctionStatus = 'scheduled' | 'active' | 'ended'

export interface AuctionProduct {
  id: string
  name: string
  category: string
}

export interface AuctionProducer {
  id: string
  name: string
}

export interface AuctionLeader {
  id: string
  name: string
}

export interface AuctionBid {
  id: string
  amount: number
  bidderId: string
  bidderName: string
  date: string | null
}

export interface AuctionRoom {
  id: string
  status: AuctionStatus
  product: AuctionProduct
  producer: AuctionProducer
  quantity: number
  unit: string
  basePrice: number
  increment: number
  currentPrice: number
  leader: AuctionLeader | null
  startsAt: string | null
  endsAt: string | null
  bids: AuctionBid[]
  viewerCount: number
  winner: AuctionLeader | null
}

export interface AuctionBidder {
  id: string
  name: string
}

export type PlaceBidResult =
  | { ok: true; bid: AuctionBid }
  | { ok: false; kind: 'invalid' | 'rejected' | 'error'; message: string }

export interface BidPlacedUpdate {
  auctionId: string
  bid: AuctionBid
  currentPrice: number
  leader: AuctionLeader | null
  endsAt: string | null
}

export interface ViewersUpdate {
  auctionId: string
  count: number
}

export interface AuctionEndedUpdate {
  auctionId: string
  winner: AuctionLeader | null
  currentPrice: number
}

export interface BidRejectedUpdate {
  auctionId: string
  bidderId: string
  amount: number | null
  code: string
  message: string
}
