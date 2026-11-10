import type { AdminReviewDto } from '../admin-reviews.dto'
import { createMockReportedReviews } from './reviews'

// The mock store lives for the session and reseeds on reload, so the queue can be
// exercised again without clearing browser storage.
let store: AdminReviewDto[] | null = null

function seed(): AdminReviewDto[] {
  if (!store) store = createMockReportedReviews()
  return store
}

function clone(dto: AdminReviewDto): AdminReviewDto {
  return {
    ...dto,
    report: dto.report ? { ...dto.report } : dto.report,
  }
}

export function listMockReportedReviews(): AdminReviewDto[] {
  return seed().map(clone)
}

// Keeping a review removes it from the queue for this session.
export function keepMockReview(id: string): AdminReviewDto | null {
  const index = seed().findIndex(
    (review) => review.id === id || review._id === id,
  )
  if (index < 0) return null

  const [review] = seed().splice(index, 1)
  review.status = 'published'
  return clone(review)
}

// Hiding keeps the review in the queue so the decision stays visible.
export function hideMockReview(id: string): AdminReviewDto | null {
  const review = seed().find(
    (entry) => entry.id === id || entry._id === id,
  )
  if (!review) return null

  review.status = 'hidden'
  return clone(review)
}
