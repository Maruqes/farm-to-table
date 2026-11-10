import type { ProducerDashboardStatsDto } from '../producer-dashboard.dto'

const DAILY_TOTALS = [186.5, 240, 132.4, 310.8, 278.2, 420.6, 355.9]

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

export function createMockDashboardStats(now = new Date()): ProducerDashboardStatsDto {
  const salesPerDay = DAILY_TOTALS.map((total, index) => ({
    day: dayOffset(now, index - (DAILY_TOTALS.length - 1)),
    total,
  }))

  return {
    sales: DAILY_TOTALS.reduce((sum, total) => sum + total, 0),
    toHandle: 4,
    activeProducts: 12,
    averageRating: 4.7,
    salesPerDay,
    byStatus: {
      pending: 4,
      confirmed: 3,
      ready: 2,
      delivered: 28,
    },
    lowStock: [
      { productId: 'prod-serra-cheese', name: 'Serra da Estrela cheese', stock: 2 },
      { productId: 'prod-heather-honey', name: 'Heather honey', stock: 4 },
      { productId: 'prod-rye-loaf', name: 'Rye loaf', stock: 5 },
    ],
    activeAuction: {
      id: 'auction-kiwi-lot',
      product: 'Kiwi',
      currentPrice: 120,
      bidCount: 12,
      viewers: 9,
    },
  }
}

export function createEmptyDashboardStats(): ProducerDashboardStatsDto {
  return {
    sales: 0,
    toHandle: 0,
    activeProducts: 0,
    averageRating: 0,
    salesPerDay: [],
    byStatus: {
      pending: 0,
      confirmed: 0,
      ready: 0,
      delivered: 0,
    },
    lowStock: [],
    activeAuction: null,
  }
}
