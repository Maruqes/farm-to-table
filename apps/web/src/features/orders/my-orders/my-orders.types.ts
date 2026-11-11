// Domain model consumed by components and hooks. API shapes stay in my-orders.dto.ts.

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export interface OrderTimelineEntry {
  status: OrderStatus
  date: string | null
}

export interface OrderProducer {
  id: string
  name: string
  location: string
  email: string
  phone: string
  lat: number | null
  lng: number | null
}

export interface OrderLine {
  productId: string
  name: string
  price: number
  quantity: number
  unit: string
}

export interface OrderRating {
  rating: number
  text: string
}

export interface MyOrder {
  id: string
  status: OrderStatus
  history: OrderTimelineEntry[]
  producer: OrderProducer
  items: OrderLine[]
  total: number
  reviewed: boolean
  review: OrderRating | null
}

export interface SubmitRatingInput {
  orderId: string
  rating: number
  text: string
}

export type RateResult =
  | { ok: true }
  | { ok: false; kind: 'already' | 'error'; message: string }

export interface OrderStatusUpdate {
  orderId: string
  status: OrderStatus
  updatedAt: string | null
}
