// Domain model consumed by components and hooks. API shapes stay in admin-orders.dto.ts.

import type { OrderStatus } from '@/features/producer/producer-orders/producer-orders.types'

// The all-orders table shows every state a producer can set, including cancelled.
export type AdminOrderStatus = OrderStatus

export type AdminOrdersStatusFilter = AdminOrderStatus | ''

export interface AdminOrder {
  id: string
  buyerName: string
  producerName: string
  itemCount: number
  total: number
  status: AdminOrderStatus
  createdAt: string | null
}

export interface AdminOrdersPage {
  items: AdminOrder[]
  total: number
}

export interface AdminOrdersFilters {
  status: AdminOrdersStatusFilter
}

// The assumed API paginates with this fixed page size; the mock mirrors it.
export const ADMIN_ORDERS_PAGE_SIZE = 8
