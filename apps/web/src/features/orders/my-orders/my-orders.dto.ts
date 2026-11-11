// API shapes assumed by FE-08. Every field may be missing or renamed later.
// GET /api/orders/mine → MyOrderDto[] ; POST /api/reviews { orderId, rating, text } → 201 ReviewDto ; 409 ALREADY_REVIEWED.
// Realtime `order-updated` → user:<id> { orderId, status, updatedAt } (CT-00).

export interface MyOrderHistoryDto {
  status?: string
  date?: string
}

export interface MyOrderProducerDto {
  id?: string
  _id?: string
  name?: string
  location?: string
  email?: string
  phone?: string
  lat?: number
  lng?: number
}

export interface MyOrderItemDto {
  productId?: string
  id?: string
  _id?: string
  name?: string
  price?: number
  quantity?: number
  unit?: string
}

export interface MyOrderReviewDto {
  rating?: number
  text?: string
}

export interface MyOrderDto {
  id?: string
  _id?: string
  status?: string
  history?: MyOrderHistoryDto[] | null
  producer?: MyOrderProducerDto | null
  items?: MyOrderItemDto[] | null
  total?: number
  reviewed?: boolean
  // The draft only promises `reviewed`; these carry the read-only rating when the API sends it.
  review?: MyOrderReviewDto | null
  rating?: number
  text?: string
}

export interface CreateReviewRequestDto {
  orderId: string
  rating: number
  text?: string
}

export interface ReviewDto {
  id?: string
  _id?: string
  orderId?: string
  rating?: number
  text?: string
  createdAt?: string
}

export interface OrderUpdatedEventDto {
  orderId?: string
  status?: string
  updatedAt?: string
}
