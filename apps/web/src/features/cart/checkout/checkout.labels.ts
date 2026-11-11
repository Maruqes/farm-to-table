import type { FulfilmentMethod, OrderStatus } from './checkout.types'

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ready: 'Ready',
  delivered: 'Delivered',
}

export const FULFILMENT_LABELS: Record<FulfilmentMethod, string> = {
  pickup: 'Pickup',
  delivery: 'Delivery',
}
