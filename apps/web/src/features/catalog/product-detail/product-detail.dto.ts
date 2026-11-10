// API shapes assumed by FE-04. Every field may be missing or renamed later.
// GET /api/products/:id → product + { description, reviews } ; 404 PRODUCT_NOT_FOUND.
export interface ProducerSummaryDto {
  id?: string
  _id?: string
  name?: string
  location?: string
}

export interface ReviewDto {
  id?: string
  _id?: string
  author?: string
  rating?: number
  text?: string
  date?: string
}

export interface ProductDetailDto {
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
  description?: string
  reviews?: ReviewDto[] | null
}
