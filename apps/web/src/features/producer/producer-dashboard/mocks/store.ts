import type { ProducerDashboardStatsDto } from '../producer-dashboard.dto'
import { createMockDashboardStats, dayKey } from './stats'

const MOCK_NEW_ORDER_TOTAL = 42.5

let stats: ProducerDashboardStatsDto | null = null

function seed(): ProducerDashboardStatsDto {
  if (!stats) stats = createMockDashboardStats()
  return stats
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

export function getMockDashboardStats(): ProducerDashboardStatsDto {
  return clone(seed())
}

// Called by the mock realtime client so the next stats read shows a new order.
export function addMockDashboardOrder(): void {
  const current = seed()
  current.sales = Math.round(((current.sales ?? 0) + MOCK_NEW_ORDER_TOTAL) * 100) / 100
  current.toHandle = (current.toHandle ?? 0) + 1

  const byStatus = current.byStatus ?? {}
  byStatus.pending = (byStatus.pending ?? 0) + 1
  current.byStatus = byStatus

  const today = dayKey(new Date())
  const salesPerDay = current.salesPerDay ?? []
  const lastPoint = salesPerDay[salesPerDay.length - 1]

  if (lastPoint?.day === today) {
    lastPoint.total = Math.round(((lastPoint.total ?? 0) + MOCK_NEW_ORDER_TOTAL) * 100) / 100
  } else {
    salesPerDay.push({ day: today, total: MOCK_NEW_ORDER_TOTAL })
    current.salesPerDay = salesPerDay.slice(-7)
  }
}
