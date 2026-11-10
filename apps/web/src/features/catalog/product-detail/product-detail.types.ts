// Domain model consumed by components and hooks. API shapes stay in product-detail.dto.ts.

export interface ProducerSummary {
  id: string
  name: string
  location: string
}

export interface Review {
  id: string
  author: string
  rating: number
  text: string
  date: string
}

export interface ProductDetail {
  id: string
  name: string
  price: number
  unit: string
  stock: number
  category: string
  imageUrl: string
  producer: ProducerSummary
  averageRating: number
  description: string
  reviews: Review[]
}
