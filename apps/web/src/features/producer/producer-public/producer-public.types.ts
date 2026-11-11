// Domain model consumed by components and hooks. API shapes stay in producer-public.dto.ts.

export interface ProducerProduct {
  id: string
  name: string
  price: number
  unit: string
  stock: number
  category: string
  imageUrl: string
  producer: {
    id: string
    name: string
    location: string
  }
  averageRating: number
}

export interface ProducerPublic {
  id: string
  name: string
  bio: string
  location: string
  lat: number | null
  lng: number | null
  averageRating: number
  products: ProducerProduct[]
}
