// Domain model consumed by components and hooks. API shapes stay in catalog.dto.ts.

export type CatalogSort = 'price-asc' | 'price-desc' | 'rating-desc'

export interface CatalogQuery {
  q?: string
  producer?: string
  category?: string
  location?: string
  season?: string
  organic?: boolean
  sort?: CatalogSort
}

export interface ProducerSummary {
  id: string
  name: string
  location: string
}

export interface Product {
  id: string
  name: string
  price: number
  unit: string
  stock: number
  category: string
  imageUrl: string
  producer: ProducerSummary
  averageRating: number
}

export interface LiveAuction {
  id: string
  productId: string
  productName: string
  currentPrice: number
  endsAt: string
}
