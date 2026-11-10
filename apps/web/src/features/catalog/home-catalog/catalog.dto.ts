// API shapes assumed by FE-03. Every field may be missing or renamed later.
export interface ProducerSummaryDto {
  id?: string
  _id?: string
  name?: string
  location?: string
}

export interface ProductDto {
  id?: string
  _id?: string
  name?: string
  price?: number
  unit?: string
  stock?: number
  category?: string
  imageUrl?: string
  producer?: ProducerSummaryDto | null
  averageRating?: number
}

export interface AuctionProductDto {
  id?: string
  _id?: string
  name?: string
  category?: string
}

export interface AuctionSummaryDto {
  id?: string
  _id?: string
  product?: AuctionProductDto | string | null
  currentPrice?: number
  endsAt?: string
}
