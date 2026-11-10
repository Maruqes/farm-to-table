import type { AdminSummaryDto } from './admin-overview.dto'
import { ADMIN_ORDER_STATUSES } from './admin-overview.labels'
import type {
  AdminOrderStatus,
  AdminOverviewSummary,
  AdminSalesPoint,
} from './admin-overview.types'

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

function asDate(value: unknown): string | null {
  const date = asString(value)
  return date && !Number.isNaN(Date.parse(date)) ? date : null
}

function emptyByStatus(): Record<AdminOrderStatus, number> {
  return {
    pending: 0,
    confirmed: 0,
    ready: 0,
    delivered: 0,
  }
}

function adaptByStatus(value: unknown): Record<AdminOrderStatus, number> {
  const result = emptyByStatus()
  if (!value || typeof value !== 'object') return result

  for (const status of ADMIN_ORDER_STATUSES) {
    result[status] = asCount((value as Record<string, unknown>)[status])
  }
  return result
}

function adaptSalesPerDay(value: AdminSummaryDto['salesPerDay']): AdminSalesPoint[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => {
      const date = asDate(entry?.date || entry?.day)
      if (!date) return null
      return { date, total: roundMoney(asNumber(entry?.total)) }
    })
    .filter((point): point is AdminSalesPoint => point !== null)
    .sort((left, right) => Date.parse(left.date) - Date.parse(right.date))
}

export function adaptAdminSummary(
  dto: AdminSummaryDto | null | undefined,
): AdminOverviewSummary {
  return {
    users: asCount(dto?.users),
    orders: asCount(dto?.orders),
    activeAuctions: asCount(dto?.activeAuctions),
    pendingProducers: asCount(dto?.pendingProducers),
    byStatus: adaptByStatus(dto?.byStatus),
    salesPerDay: adaptSalesPerDay(dto?.salesPerDay),
  }
}
