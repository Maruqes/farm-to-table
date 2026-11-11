import type { ProducerReviewDto } from '../producer-reviews.dto'
import { createMockProducerReviews } from './reviews'

let store: ProducerReviewDto[] | null = null

function seed(): ProducerReviewDto[] {
  if (!store) store = createMockProducerReviews()
  return store
}

function clone(dto: ProducerReviewDto): ProducerReviewDto {
  return { ...dto }
}

export function listMockReviews(): ProducerReviewDto[] {
  return seed().map(clone)
}

// Reporting is idempotent: a review that is already reported stays reported.
export function reportMockReview(
  id: string,
  _reason: string,
): ProducerReviewDto | null {
  const review = seed().find((entry) => entry.id === id || entry._id === id)
  if (!review) return null

  review.reported = true
  return clone(review)
}
