// Domain model consumed by components and hooks. API shapes stay in checkout.dto.ts.

export type FulfilmentMethod = 'pickup' | 'delivery'

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'delivered'

export interface CheckoutAddress {
  line1: string
  city: string
  postalCode: string
}

export interface CheckoutInput {
  fulfilment: FulfilmentMethod
  address?: CheckoutAddress
}

export interface OrderLine {
  productId: string
  name: string
  price: number
  quantity: number
  unit: string
}

export interface OrderProducer {
  id: string
  name: string
  location: string
}

export interface PlacedOrder {
  id: string
  producer: OrderProducer
  status: OrderStatus
  items: OrderLine[]
  total: number
}

export interface CheckoutFieldErrors {
  line1?: string
  city?: string
  postalCode?: string
}

export type PlaceOrderResult =
  | { ok: true; orders: PlacedOrder[] }
  | {
      ok: false
      kind: 'stock' | 'validation' | 'error'
      message: string
      fieldErrors?: CheckoutFieldErrors
    }
