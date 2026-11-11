import type { ProducerReview } from './producer-reviews.types'

// A review without a product is about the producer's public page.
export const PRODUCER_PAGE_REVIEW = 'Producer page'

export function reviewSubject(review: ProducerReview): string {
  return review.product ?? PRODUCER_PAGE_REVIEW
}

export const REPORT_REASON_OPTIONS = [
  { value: 'spam', label: 'Spam or advertising' },
  { value: 'offensive', label: 'Offensive or abusive language' },
  { value: 'unrelated', label: 'Not about this producer or product' },
  { value: 'misleading', label: 'False or misleading' },
  { value: 'other', label: 'Something else' },
] as const

export type ReportReason = (typeof REPORT_REASON_OPTIONS)[number]['value']

export interface ReviewSummary {
  average: number
  count: number
  reported: number
}

export function summariseReviews(reviews: ProducerReview[]): ReviewSummary {
  if (reviews.length === 0) return { average: 0, count: 0, reported: 0 }

  const total = reviews.reduce((sum, review) => sum + review.rating, 0)
  return {
    average: Math.round((total / reviews.length) * 10) / 10,
    count: reviews.length,
    reported: reviews.filter((review) => review.reported).length,
  }
}
