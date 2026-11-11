import { ApiError } from '@/services/api'
import type { ProducerDashboardStatsDto } from './producer-dashboard.dto'
import type { ProducerDashboardService } from './producer-dashboard.service'
import { getMockDashboardStats } from './mocks/store'
import { createEmptyDashboardStats } from './mocks/stats'

const MOCK_LATENCY_MS = 550

// Set `ftt.producer-dashboard.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_DASHBOARD_ERROR_KEY = 'ftt.producer-dashboard.mock-error'
// Set `ftt.producer-dashboard.mock-empty` to `1` to exercise the empty state.
export const MOCK_DASHBOARD_EMPTY_KEY = 'ftt.producer-dashboard.mock-empty'

function wait(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })
}

function isFlagOn(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export const producerDashboardMockService: ProducerDashboardService = {
  async getStats(): Promise<ProducerDashboardStatsDto> {
    await wait()

    if (isFlagOn(MOCK_DASHBOARD_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Your dashboard could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_DASHBOARD_EMPTY_KEY)) return createEmptyDashboardStats()

    return getMockDashboardStats()
  },
}
