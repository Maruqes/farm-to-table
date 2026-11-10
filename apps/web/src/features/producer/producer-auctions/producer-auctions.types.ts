// Domain model consumed by components and hooks. API shapes stay in producer-auctions.dto.ts.

export type AuctionStatus = 'draft' | 'scheduled' | 'active' | 'ended'

export interface AuctionProduct {
  id: string
  name: string
  category: string
}

export interface AuctionLeader {
  id: string
  name: string
}

export interface ProducerAuction {
  id: string
  status: AuctionStatus
  product: AuctionProduct
  quantity: number
  unit: string
  basePrice: number
  increment: number
  durationMinutes: number
  startsAt: string | null
  endsAt: string | null
  currentPrice: number
  bidCount: number
  leader: AuctionLeader | null
  createdAt: string | null
}

export interface AuctionInput {
  productId: string
  quantity: number
  basePrice: number
  increment: number
  durationMinutes: number
  startsAt: string
}

export interface AuctionFormValues {
  productId: string
  quantity: string
  basePrice: string
  increment: string
  duration: string
  customMinutes: string
  startAt: string
}

export type AuctionField =
  | 'productId'
  | 'quantity'
  | 'basePrice'
  | 'increment'
  | 'duration'
  | 'startAt'

export type AuctionFieldErrors = Partial<Record<AuctionField, string>>

export type AuctionSaveIntent = 'draft' | 'publish'

export type AuctionActionResult =
  | { ok: true }
  | { ok: false; message: string; fields?: Record<string, string>; draftSaved?: boolean }
