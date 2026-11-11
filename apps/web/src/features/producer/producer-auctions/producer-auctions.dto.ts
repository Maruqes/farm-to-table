// API shapes assumed by FE-15. Every field may be missing or renamed later.
// GET /api/auctions?producer=me -> ProducerAuctionDto[] ; producer token required.
// POST /api/auctions -> 201 ProducerAuctionDto ; PUT /api/auctions/:id (draft only) -> 200.
// POST /api/auctions/:id/publish -> 200 ; POST /api/auctions/:id/cancel -> 200, 409 AUCTION_HAS_BIDS.

export interface ProducerAuctionProductDto {
  id?: string
  _id?: string
  name?: string
  category?: string
  unit?: string
}

export interface ProducerAuctionLeaderDto {
  id?: string
  _id?: string
  name?: string
}

export interface ProducerAuctionDto {
  id?: string
  _id?: string
  status?: string
  product?: ProducerAuctionProductDto | string | null
  quantity?: number
  unit?: string
  basePrice?: number
  increment?: number
  durationMinutes?: number
  startsAt?: string
  endsAt?: string
  currentPrice?: number
  bidCount?: number
  leader?: ProducerAuctionLeaderDto | null
  createdAt?: string
}

export interface SaveProducerAuctionRequestDto {
  productId: string
  quantity: number
  basePrice: number
  increment: number
  durationMinutes: number
  startsAt: string
}
