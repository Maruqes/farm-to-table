import type { AdminOrderStatus } from './admin-overview.types'

// One shared map for every order state in the admin overview.
export const ADMIN_ORDER_STATUSES: AdminOrderStatus[] = [
  'pending',
  'confirmed',
  'ready',
  'delivered',
]

export const ADMIN_ORDER_STATUS_LABELS: Record<AdminOrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  ready: 'Ready',
  delivered: 'Delivered',
}
