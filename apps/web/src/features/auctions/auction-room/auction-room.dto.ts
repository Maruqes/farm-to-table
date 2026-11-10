// API shapes assumed by FE-11. Every field may be missing or renamed later.
// GET /api/auctions/:id → AuctionRoomDto ; POST /api/auctions/:id/bids { amount } → 201 AuctionBidDto ; 409 on a lost race.
// Socket room `auction:<id>`: bid-placed, bid-rejected (to the bidder), viewers, auction-ended.

export interface AuctionProductDto {
  id?: string
  _id?: string
  name?: string
  category?: string
}

export interface AuctionProducerDto {
  id?: string
  _id?: string
  name?: string
}

export interface AuctionLeaderDto {
  id?: string
  _id?: string
  name?: string
}

export interface AuctionBidDto {
  id?: string
  _id?: string
  amount?: number
  name?: string
  bidderId?: string
  date?: string
}

export interface AuctionRoomDto {
  id?: string
  _id?: string
  status?: string
  product?: AuctionProductDto | string | null
  producer?: AuctionProducerDto | null
  quantity?: number
  unit?: string
  basePrice?: number
  increment?: number
  currentPrice?: number
  leader?: AuctionLeaderDto | null
  startsAt?: string
  endsAt?: string
  bids?: AuctionBidDto[] | null
  viewerCount?: number
  winner?: AuctionLeaderDto | null
}

export interface PlaceBidRequestDto {
  amount: number
}

export interface BidPlacedEventDto {
  auctionId?: string
  bid?: AuctionBidDto | null
  currentPrice?: number
  leader?: AuctionLeaderDto | null
  endsAt?: string
}

export interface ViewersEventDto {
  auctionId?: string
  count?: number
}

export interface AuctionEndedEventDto {
  auctionId?: string
  status?: string
  winner?: AuctionLeaderDto | null
  currentPrice?: number
}

export interface BidRejectedEventDto {
  auctionId?: string
  bidderId?: string
  amount?: number
  code?: string
  message?: string
}
