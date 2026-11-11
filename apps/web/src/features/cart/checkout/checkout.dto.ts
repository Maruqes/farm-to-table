// API shapes assumed by FE-07. Every field may be missing or renamed later.
// POST /api/orders { fulfilment, address? } → 201 OrderDto[] ; 400 VALIDATION_ERROR ; 409 STOCK_CHANGED.

export type FulfilmentDto = 'pickup' | 'delivery'

export interface CheckoutAddressDto {
  line1?: string
  city?: string
  postalCode?: string
}

export interface CreateOrderRequestDto {
  fulfilment: FulfilmentDto
  address?: CheckoutAddressDto
}

export interface OrderItemDto {
  productId?: string
  id?: string
  _id?: string
  name?: string
  price?: number
  quantity?: number
  unit?: string
}

export interface OrderProducerDto {
  id?: string
  _id?: string
  name?: string
  location?: string
}

export interface OrderDto {
  id?: string
  _id?: string
  producer?: OrderProducerDto | null
  status?: string
  items?: OrderItemDto[] | null
  total?: number
}
