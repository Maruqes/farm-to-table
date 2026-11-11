import { ApiError } from '@/services/api'
import type { PendingProducerDto } from './admin-producers.dto'
import type { AdminProducersService } from './admin-producers.service'
import {
  listMockPendingProducers,
  removeMockPendingProducer,
} from './mocks/producers'

const MOCK_LATENCY_MS = 500
const MOCK_ACTION_LATENCY_MS = 600

// Set `ftt.admin-producers.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_ADMIN_PRODUCERS_ERROR_KEY = 'ftt.admin-producers.mock-error'
// Set `ftt.admin-producers.mock-empty` to `1` to exercise the empty state.
export const MOCK_ADMIN_PRODUCERS_EMPTY_KEY = 'ftt.admin-producers.mock-empty'
// Set `ftt.admin-producers.mock-action-error` to `1` to exercise a failed approval or rejection.
export const MOCK_ADMIN_PRODUCERS_ACTION_ERROR_KEY =
  'ftt.admin-producers.mock-action-error'

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

function notFound(): ApiError {
  return new ApiError(
    404,
    'PRODUCER_NOT_FOUND',
    'This producer is no longer waiting for approval. Refresh the list and try again.',
  )
}

export const adminProducersMockService: AdminProducersService = {
  async listPending(): Promise<PendingProducerDto[]> {
    await wait(MOCK_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_PRODUCERS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Pending producers could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_ADMIN_PRODUCERS_EMPTY_KEY)) return []

    return listMockPendingProducers()
  },

  async approve(id: string): Promise<void> {
    await wait(MOCK_ACTION_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_PRODUCERS_ACTION_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The producer could not be approved. Please try again.',
      )
    }

    if (!removeMockPendingProducer(id)) throw notFound()
  },

  async reject(id: string): Promise<void> {
    await wait(MOCK_ACTION_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_PRODUCERS_ACTION_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The producer could not be rejected. Please try again.',
      )
    }

    if (!removeMockPendingProducer(id)) throw notFound()
  },
}
