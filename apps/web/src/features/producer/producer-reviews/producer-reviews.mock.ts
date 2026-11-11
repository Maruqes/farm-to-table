import { ApiError } from '@/services/api'
import type { ProducerReviewDto } from './producer-reviews.dto'
import type { ProducerReviewsService } from './producer-reviews.service'
import { listMockReviews, reportMockReview } from './mocks/store'

const MOCK_LATENCY_MS = 500

// Set `ftt.producer-reviews.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_REVIEWS_ERROR_KEY = 'ftt.producer-reviews.mock-error'
// Set `ftt.producer-reviews.mock-empty` to `1` to exercise the empty state.
export const MOCK_REVIEWS_EMPTY_KEY = 'ftt.producer-reviews.mock-empty'
// Set `ftt.producer-reviews.mock-report-error` to `1` to exercise a failed report.
export const MOCK_REVIEWS_REPORT_ERROR_KEY = 'ftt.producer-reviews.mock-report-error'

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

export const producerReviewsMockService: ProducerReviewsService = {
  async listMine(): Promise<ProducerReviewDto[]> {
    await wait()

    if (isFlagOn(MOCK_REVIEWS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Your reviews could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_REVIEWS_EMPTY_KEY)) return []

    return listMockReviews()
  },

  async report(id: string, reason: string): Promise<ProducerReviewDto> {
    await wait()

    if (isFlagOn(MOCK_REVIEWS_REPORT_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The review could not be reported. Please try again.',
      )
    }

    const review = reportMockReview(id, reason)
    if (!review) {
      throw new ApiError(
        404,
        'REVIEW_NOT_FOUND',
        'This review no longer exists. Refresh the list and try again.',
      )
    }

    return review
  },
}
