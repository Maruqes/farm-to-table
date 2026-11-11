import { ORDER_STATUS_LABELS } from '@/features/orders/my-orders/my-orders.labels'
import type { DashboardOrderStatus } from './producer-dashboard.types'

// The order states already used by checkout and buyer orders, in lifecycle order.
// Cancelled orders are excluded from the producer dashboard by contract (CT-12).
export const DASHBOARD_ORDER_STATUSES: DashboardOrderStatus[] = [
  'pending',
  'confirmed',
  'ready',
  'delivered',
]

export const DASHBOARD_STATUS_LABELS = ORDER_STATUS_LABELS
