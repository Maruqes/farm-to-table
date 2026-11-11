// API shapes assumed by FE-24. Every field may be missing or renamed later.
// GET /api/admin/auctions?status&page -> AdminAuctionsPageDto ; admin token required.
// `status` is draft|scheduled|active|ended and `page` is 1-based.
// The API paginates with a fixed page size of 8 (ADMIN_AUCTIONS_PAGE_SIZE in
// admin-auctions.types.ts).

export interface AdminAuctionProductDto {
  id?: string
  _id?: string
  name?: string
  category?: string
}

export interface AdminAuctionProducerDto {
  id?: string
  _id?: string
  name?: string
}

export interface AdminAuctionDto {
  id?: string
  _id?: string
  status?: string
  // The draft may send the product or producer as an object or just a name.
  product?: AdminAuctionProductDto | string | null
  productName?: string
  producer?: AdminAuctionProducerDto | string | null
  producerName?: string
  currentPrice?: number
  bidCount?: number
  startsAt?: string
  endsAt?: string
}

export interface AdminAuctionsPageDto {
  items?: AdminAuctionDto[] | null
  total?: number
}
