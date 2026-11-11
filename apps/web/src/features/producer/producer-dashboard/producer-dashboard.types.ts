// Domain model consumed by components and hooks. API shapes stay in producer-dashboard.dto.ts.

import type { OrderStatus } from '@/features/orders/my-orders/my-orders.types'

export type DashboardOrderStatus = Exclude<OrderStatus, 'cancelled'>

export interface DashboardSalesPoint {
  day: string
  total: number
}

export interface DashboardLowStockItem {
  productId: string
  name: string
  stock: number
}

export interface DashboardActiveAuction {
  id: string
  product: string
  currentPrice: number
  bidCount: number
  viewers: number
}

export interface ProducerDashboardStats {
  sales: number
  toHandle: number
  activeProducts: number
  averageRating: number
  salesPerDay: DashboardSalesPoint[]
  byStatus: Record<DashboardOrderStatus, number>
  lowStock: DashboardLowStockItem[]
  activeAuction: DashboardActiveAuction | null
}
