import type { OrderStatus } from '@/features/orders/my-orders/my-orders.types'
import type {
  ProducerDashboardActiveAuctionDto,
  ProducerDashboardAuctionProductDto,
  ProducerDashboardStatsDto,
} from './producer-dashboard.dto'
import { DASHBOARD_ORDER_STATUSES } from './producer-dashboard.labels'
import type {
  DashboardActiveAuction,
  DashboardLowStockItem,
  DashboardSalesPoint,
  ProducerDashboardStats,
} from './producer-dashboard.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asCount(value: unknown): number {
  return Math.max(0, Math.floor(asNumber(value)))
}

function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100
}

function asDay(value: unknown): string | null {
  const day = asString(value)
  return day && !Number.isNaN(Date.parse(day)) ? day : null
}

function emptyByStatus(): Record<OrderStatus, number> {
  return {
    pending: 0,
    confirmed: 0,
    ready: 0,
    delivered: 0,
  }
}

function adaptByStatus(value: unknown): Record<OrderStatus, number> {
  const result = emptyByStatus()
  if (!value || typeof value !== 'object') return result

  for (const status of DASHBOARD_ORDER_STATUSES) {
    result[status] = asCount((value as Record<string, unknown>)[status])
  }
  return result
}

function adaptSalesPerDay(
  value: ProducerDashboardStatsDto['salesPerDay'],
): DashboardSalesPoint[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      const day = asDay(entry?.day)
      if (!day) return null
      return { day, total: roundMoney(asNumber(entry?.total)) }
    })
    .filter((point): point is DashboardSalesPoint => point !== null)
    .sort((left, right) => Date.parse(left.day) - Date.parse(right.day))
}

function adaptLowStock(
  value: ProducerDashboardStatsDto['lowStock'],
): DashboardLowStockItem[] {
  if (!Array.isArray(value)) return []

  return value.map((entry, index) => ({
    productId: asString(entry?.productId || entry?._id, `low-stock-${index + 1}`),
    name: asString(entry?.name, 'Product'),
    stock: asCount(entry?.stock),
  }))
}

function adaptAuctionProduct(
  value: ProducerDashboardActiveAuctionDto['product'],
): string {
  if (typeof value === 'string') return asString(value, 'Auction lot')
  return asString((value as ProducerDashboardAuctionProductDto | null | undefined)?.name, 'Auction lot')
}

function adaptActiveAuction(
  value: ProducerDashboardActiveAuctionDto | null | undefined,
): DashboardActiveAuction | null {
  const id = asString(value?.id || value?._id)
  if (!id) return null

  return {
    id,
    product: adaptAuctionProduct(value?.product),
    currentPrice: roundMoney(asNumber(value?.currentPrice)),
    bidCount: asCount(value?.bidCount),
    viewers: asCount(value?.viewers),
  }
}

export function adaptProducerDashboard(
  dto: ProducerDashboardStatsDto | null | undefined,
): ProducerDashboardStats {
  return {
    sales: roundMoney(asNumber(dto?.sales)),
    toHandle: asCount(dto?.toHandle),
    activeProducts: asCount(dto?.activeProducts),
    averageRating: Math.min(5, Math.max(0, asNumber(dto?.averageRating))),
    salesPerDay: adaptSalesPerDay(dto?.salesPerDay),
    byStatus: adaptByStatus(dto?.byStatus),
    lowStock: adaptLowStock(dto?.lowStock),
    activeAuction: adaptActiveAuction(dto?.activeAuction),
  }
}
