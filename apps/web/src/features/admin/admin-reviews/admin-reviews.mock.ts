import { ApiError } from '@/services/api'
import type { AdminReviewDto } from './admin-reviews.dto'
import type { AdminReviewsService } from './admin-reviews.service'
import {
  hideMockReview,
  keepMockReview,
  listMockReportedReviews,
} from './mocks/store'

const MOCK_LATENCY_MS = 500
const MOCK_ACTION_LATENCY_MS = 600

// Set `ftt.admin-reviews.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_ADMIN_REVIEWS_ERROR_KEY = 'ftt.admin-reviews.mock-error'
// Set `ftt.admin-reviews.mock-empty` to `1` to exercise the empty state.
export const MOCK_ADMIN_REVIEWS_EMPTY_KEY = 'ftt.admin-reviews.mock-empty'
// Set `ftt.admin-reviews.mock-action-error` to `1` to exercise a failed keep or hide.
export const MOCK_ADMIN_REVIEWS_ACTION_ERROR_KEY =
  'ftt.admin-reviews.mock-action-error'

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
    'REVIEW_NOT_FOUND',
    'This review is no longer in the queue. Refresh the list and try again.',
  )
}

export const adminReviewsMockService: AdminReviewsService = {
  async listReported(): Promise<AdminReviewDto[]> {
    await wait(MOCK_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_REVIEWS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Reported reviews could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_ADMIN_REVIEWS_EMPTY_KEY)) return []

    return listMockReportedReviews()
  },

  async keep(id: string): Promise<AdminReviewDto> {
    await wait(MOCK_ACTION_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_REVIEWS_ACTION_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The review could not be kept. Please try again.',
      )
    }

    const review = keepMockReview(id)
    if (!review) throw notFound()
    return review
  },

  async hide(id: string): Promise<AdminReviewDto> {
    await wait(MOCK_ACTION_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_REVIEWS_ACTION_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The review could not be hidden. Please try again.',
      )
    }

    const review = hideMockReview(id)
    if (!review) throw notFound()
    return review
  },
}
