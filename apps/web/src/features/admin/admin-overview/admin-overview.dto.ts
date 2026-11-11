// API shape assumed by FE-18. Every field may be missing or renamed later.
// GET /api/admin/summary -> AdminSummaryDto ; admin token required.

export interface AdminSalesDayDto {
  date?: string
  day?: string
  total?: number
}

export interface AdminSummaryDto {
  users?: number
  orders?: number
  activeAuctions?: number
  pendingProducers?: number
  byStatus?: Record<string, number> | null
  salesPerDay?: AdminSalesDayDto[] | null
}
