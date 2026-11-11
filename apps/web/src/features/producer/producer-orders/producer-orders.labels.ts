import type { FulfilmentMethod, OrderStatus } from './producer-orders.types'

// One shared map for every order state, as DESIGN.md requires.
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ready: 'Ready',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// SCOPE.md §0: orders move forward one step at a time. Cancelling only leaves `pending`.
export const ORDER_STATUS_STEPS: OrderStatus[] = [
  'pending',
  'confirmed',
  'ready',
  'delivered',
]

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending: 'confirmed',
  confirmed: 'ready',
  ready: 'delivered',
  delivered: null,
  cancelled: null,
}

export const FULFILMENT_LABELS: Record<FulfilmentMethod, string> = {
  pickup: 'Pickup at the farm',
  delivery: 'Delivery',
}

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  return NEXT_STATUS[status]
}

export function canCancel(status: OrderStatus): boolean {
  return status === 'pending'
}

export function fulfilmentLabel(method: FulfilmentMethod): string {
  return FULFILMENT_LABELS[method]
}

// Long database ids are shortened for the row label; the full id stays in the `title`.
export function shortOrderRef(id: string): string {
  if (!id) return '—'
  return id.length <= 10 ? id : `#${id.slice(-6)}`
}
