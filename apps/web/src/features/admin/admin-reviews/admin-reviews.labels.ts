import type { AdminReview, AdminReviewStatus } from './admin-reviews.types'

export const REPORT_REASON_LABELS: Record<string, string> = {
  spam: 'Spam or advertising',
  offensive: 'Offensive or abusive language',
  unrelated: 'Not about the product or producer',
  misleading: 'False or misleading',
  other: 'Something else',
}

export const REPORT_REASON_FALLBACK = 'Reported by a community member'

// Reports arrive either as a stable code or as free text from the report dialog.
export function reportReasonLabel(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return REPORT_REASON_FALLBACK
  return REPORT_REASON_LABELS[trimmed.toLowerCase()] ?? trimmed
}

export const REVIEW_STATUS_LABELS: Record<AdminReviewStatus, string> = {
  reported: 'Awaiting decision',
  hidden: 'Hidden',
}

// A review without a product is about the producer's public page.
export function reviewSubject(review: AdminReview): string {
  if (review.product && review.producer) {
    return `${review.product} · ${review.producer}`
  }
  return review.product ?? review.producer ?? 'Producer page'
}
