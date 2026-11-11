// API shape assumed by FE-27. Every field may be missing or renamed later.
// GET /api/auctions?status=active|scheduled|ended -> AuctionListItemDto[]

export interface AuctionListProductDto {
  id?: string
  _id?: string
  name?: string
  category?: string
}

export interface AuctionListItemDto {
  id?: string
  _id?: string
  product?: AuctionListProductDto | string | null
  currentPrice?: number
  endsAt?: string
  viewers?: number
  // Accepted defensively because the room contract calls this field viewerCount.
  viewerCount?: number
  status?: string
}
