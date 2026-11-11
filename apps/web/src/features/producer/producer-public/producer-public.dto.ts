// API shape assumed by FE-05. Every field may be missing or renamed later.
// GET /api/producers/:id → producer + { bio, location, lat, lng, averageRating, products } ; 404 PRODUCER_NOT_FOUND.

export interface ProducerPublicProductDto {
  id?: string
  _id?: string
  name?: string
  price?: number
  unit?: string
  stock?: number
  category?: string
  imageUrl?: string
  averageRating?: number
}

export interface ProducerPublicDto {
  id?: string
  _id?: string
  name?: string
  bio?: string
  location?: string
  lat?: number
  lng?: number
  averageRating?: number
  products?: ProducerPublicProductDto[] | null
}
