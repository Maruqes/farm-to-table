import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_STEPS,
  shortOrderRef,
} from '@/features/producer/producer-orders/producer-orders.labels'
import type {
  AdminOrderStatus,
  AdminOrdersStatusFilter,
} from './admin-orders.types'

// Reuse the shared order-state map instead of redefining the labels here.
export { ORDER_STATUS_LABELS, shortOrderRef }

// Cancelled is reachable only from pending, but the admin list shows every order.
export const ADMIN_ORDER_STATUS_ORDER: AdminOrderStatus[] = [
  ...ORDER_STATUS_STEPS,
  'cancelled',
]

export const ADMIN_ORDERS_STATUS_FILTER_OPTIONS: {
  value: AdminOrdersStatusFilter
  label: string
}[] = [
  { value: '', label: 'All statuses' },
  ...ADMIN_ORDER_STATUS_ORDER.map((status) => ({
    value: status,
    label: ORDER_STATUS_LABELS[status],
  })),
]
