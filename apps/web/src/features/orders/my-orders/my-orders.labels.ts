import type { OrderStatus } from './my-orders.types'

// One shared map for every order state, as DESIGN.md requires.
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ready: 'Ready',
  delivered: 'Delivered',
}

export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'ready',
  'delivered',
]
