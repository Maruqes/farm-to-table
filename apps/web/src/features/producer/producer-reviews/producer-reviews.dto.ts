// API shapes assumed by FE-16. Every field may be missing or renamed later.
// GET /api/reviews?producer=me -> ProducerReviewDto[] ; producer token required.
// POST /api/reviews/:id/report { reason } -> 200 ProducerReviewDto ; 404 REVIEW_NOT_FOUND.

export interface ProducerReviewDto {
  id?: string
  _id?: string
  author?: string
  rating?: number
  text?: string
  // Product name for a product review; empty or missing for the producer page.
  product?: string | { id?: string; _id?: string; name?: string } | null
  reported?: boolean
}

export interface ReportReviewRequestDto {
  reason: string
}
