import { ApiError } from '@/services/api'
import type { AdminSummaryDto } from './admin-overview.dto'
import type { AdminOverviewService } from './admin-overview.service'
import { createEmptyAdminSummary, createMockAdminSummary } from './mocks/summary'

const MOCK_LATENCY_MS = 500

// Set `ftt.admin-overview.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_ADMIN_OVERVIEW_ERROR_KEY = 'ftt.admin-overview.mock-error'
// Set `ftt.admin-overview.mock-empty` to `1` to exercise the empty state.
export const MOCK_ADMIN_OVERVIEW_EMPTY_KEY = 'ftt.admin-overview.mock-empty'

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

export const adminOverviewMockService: AdminOverviewService = {
  async getSummary(): Promise<AdminSummaryDto> {
    await wait()

    if (isFlagOn(MOCK_ADMIN_OVERVIEW_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The admin summary could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_ADMIN_OVERVIEW_EMPTY_KEY)) return createEmptyAdminSummary()

    return createMockAdminSummary()
  },
}
