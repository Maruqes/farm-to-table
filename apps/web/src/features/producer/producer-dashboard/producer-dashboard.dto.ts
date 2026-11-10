// API shape assumed by FE-12. Every field may be missing or renamed later.
// GET /api/producers/me/stats -> ProducerDashboardStatsDto ; producer token required.

export interface ProducerDashboardSalesDayDto {
  day?: string
  total?: number
}

export interface ProducerDashboardLowStockDto {
  productId?: string
  _id?: string
  name?: string
  stock?: number
}

export interface ProducerDashboardAuctionProductDto {
  id?: string
  _id?: string
  name?: string
}

export interface ProducerDashboardActiveAuctionDto {
  id?: string
  _id?: string
  product?: ProducerDashboardAuctionProductDto | string | null
  currentPrice?: number
  bidCount?: number
  viewers?: number
}

export interface ProducerDashboardStatsDto {
  sales?: number
  toHandle?: number
  activeProducts?: number
  averageRating?: number
  salesPerDay?: ProducerDashboardSalesDayDto[] | null
  byStatus?: Record<string, number> | null
  lowStock?: ProducerDashboardLowStockDto[] | null
  activeAuction?: ProducerDashboardActiveAuctionDto | null
}
