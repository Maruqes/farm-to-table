// API shapes assumed by FE-14. Every field may be missing or renamed later.
// GET /api/orders?producer=me -> ProducerOrderDto[] ; producer token required.
// PATCH /api/orders/:id/status { status } -> ProducerOrderDto ; 400 INVALID_STATUS_TRANSITION, 403.
// Realtime `order-updated` and `order-created` arrive on user:<id> (CT-00).

export interface ProducerOrderBuyerDto {
  id?: string
  _id?: string
  name?: string
  email?: string
  phone?: string
}

export interface ProducerOrderItemDto {
  productId?: string
  id?: string
  _id?: string
  name?: string
  price?: number
  quantity?: number
  unit?: string
}

// CT-07 spells this `fulfilment` and sends the address as an object.
export interface ProducerOrderAddressDto {
  line1?: string
  city?: string
  postalCode?: string
}

export interface ProducerOrderDto {
  id?: string
  _id?: string
  status?: string
  createdAt?: string
  updatedAt?: string
  buyer?: ProducerOrderBuyerDto | null
  items?: ProducerOrderItemDto[] | null
  total?: number
  fulfilment?: string
  address?: ProducerOrderAddressDto | null
}

export interface UpdateOrderStatusRequestDto {
  status: string
}

// CT-00 `order-updated` payload, plus `order-created` from the same room.
export interface OrderStatusUpdatedEventDto {
  orderId?: string
  status?: string
  updatedAt?: string
}

// The draft may send the order itself or wrap it; the adapter accepts both.
export type OrderCreatedEventDto = ProducerOrderDto & { order?: ProducerOrderDto }
