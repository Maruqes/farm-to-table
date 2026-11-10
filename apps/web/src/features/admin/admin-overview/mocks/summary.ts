import type { AdminSummaryDto } from '../admin-overview.dto'

const DAILY_TOTALS = [540.2, 725.4, 468.9, 812.6, 690.3, 1045.8, 930.5]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

// Local calendar day as YYYY-MM-DD, so the mock chart follows the browser clock.
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function dayOffset(now: Date, offsetDays: number): string {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays)
  return dayKey(date)
}

export function createMockAdminSummary(now = new Date()): AdminSummaryDto {
  const salesPerDay = DAILY_TOTALS.map((total, index) => ({
    date: dayOffset(now, index - (DAILY_TOTALS.length - 1)),
    total,
  }))

  return {
    users: 248,
    orders: 132,
    activeAuctions: 3,
    pendingProducers: 5,
    byStatus: {
      pending: 6,
      confirmed: 8,
      ready: 4,
      delivered: 114,
    },
    salesPerDay,
  }
}

export function createEmptyAdminSummary(): AdminSummaryDto {
  return {
    users: 0,
    orders: 0,
    activeAuctions: 0,
    pendingProducers: 0,
    byStatus: {
      pending: 0,
      confirmed: 0,
      ready: 0,
      delivered: 0,
    },
    salesPerDay: [],
  }
}
