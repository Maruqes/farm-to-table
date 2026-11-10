import type { OrderStatus } from '@/features/orders/my-orders/my-orders.types'
import { ORDER_STATUS_LABELS } from '@/features/orders/my-orders/my-orders.labels'

// The order states already used by checkout and buyer orders, in lifecycle order.
export const DASHBOARD_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'ready',
  'delivered',
]

export const DASHBOARD_STATUS_LABELS = ORDER_STATUS_LABELS
