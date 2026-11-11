import { ApiError } from '@/services/api'
import type { AdminServiceStatusDto } from './admin-status.dto'
import type { AdminStatusService } from './admin-status.service'
import { listMockServiceStatuses } from './mocks/services'

const MOCK_LATENCY_MS = 450

// Set `ftt.admin-status.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_ADMIN_STATUS_ERROR_KEY = 'ftt.admin-status.mock-error'
// Set `ftt.admin-status.mock-empty` to `1` to exercise the empty state.
export const MOCK_ADMIN_STATUS_EMPTY_KEY = 'ftt.admin-status.mock-empty'

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function isFlagOn(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export const adminStatusMockService: AdminStatusService = {
  async getStatus(): Promise<AdminServiceStatusDto[]> {
    await wait(MOCK_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_STATUS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Service status could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_ADMIN_STATUS_EMPTY_KEY)) return []

    return listMockServiceStatuses()
  },
}
