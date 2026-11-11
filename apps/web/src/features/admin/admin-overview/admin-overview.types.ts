// Domain model consumed by components and hooks. API shapes stay in admin-overview.dto.ts.

export type AdminOrderStatus = 'pending' | 'confirmed' | 'ready' | 'delivered'

export interface AdminSalesPoint {
  date: string
  total: number
}

export interface AdminOverviewSummary {
  users: number
  orders: number
  activeAuctions: number
  pendingProducers: number
  byStatus: Record<AdminOrderStatus, number>
  salesPerDay: AdminSalesPoint[]
}
