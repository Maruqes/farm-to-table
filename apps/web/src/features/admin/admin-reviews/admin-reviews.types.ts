// Domain model consumed by components and hooks. API shapes stay in admin-reviews.dto.ts.

export type AdminReviewStatus = 'reported' | 'hidden'

export type ReviewModerationDecision = 'keep' | 'hide'

export interface AdminReview {
  id: string
  author: string
  rating: number
  text: string
  // `null` means the review is on the producer's public page, not a single product.
  product: string | null
  producer: string | null
  createdAt: string | null
  reportReason: string
  reportNote: string | null
  reportedAt: string | null
  status: AdminReviewStatus
}

export interface AdminReviewDecision {
  id: string
  action: ReviewModerationDecision
}

export type ReviewDecisionResult =
  | { ok: true; review: AdminReview }
  | { ok: false; message: string }
