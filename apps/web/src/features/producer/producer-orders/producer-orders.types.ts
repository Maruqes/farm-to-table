// Domain model consumed by components and hooks. API shapes stay in producer-orders.dto.ts.

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'ready'
  | 'delivered'
  | 'cancelled'

export type FulfilmentMethod = 'pickup' | 'delivery'

export interface OrderBuyer {
  id: string
  name: string
  email: string
  phone: string
}

export interface OrderLine {
  productId: string
  name: string
  price: number
  quantity: number
  unit: string
}

export interface OrderFulfilment {
  method: FulfilmentMethod
  address: string
}

export interface ProducerOrder {
  id: string
  status: OrderStatus
  createdAt: string | null
  buyer: OrderBuyer
  items: OrderLine[]
  total: number
  fulfilment: OrderFulfilment
}

export interface OrderStatusUpdate {
  orderId: string
  status: OrderStatus
  updatedAt: string | null
}

export type OrderActionResult = { ok: true } | { ok: false; message: string }
