// Domain model consumed by components and hooks. API shapes stay in producer-reviews.dto.ts.

export interface ProducerReview {
  id: string
  author: string
  rating: number
  text: string
  // `null` means the review is on the producer's public page, not a single product.
  product: string | null
  reported: boolean
}

export type ReportReviewResult =
  | { ok: true; review: ProducerReview }
  | { ok: false; message: string }
