// API shapes assumed by FE-20. Every field may be missing or renamed later.
// GET /api/admin/reviews?reported=true -> AdminReviewDto[] ; admin token required.
// POST /api/admin/reviews/:id/keep -> 200 AdminReviewDto.
// POST /api/admin/reviews/:id/hide -> 200 AdminReviewDto.

export interface ReviewSubjectDto {
  id?: string
  _id?: string
  name?: string
}

export interface ReviewReportDto {
  reason?: string
  note?: string
  reporter?: string
  reportedAt?: string
}

export interface AdminReviewDto {
  id?: string
  _id?: string
  author?: string
  rating?: number
  text?: string
  // Product and producer names for a product review; the producer alone for a page review.
  product?: string | ReviewSubjectDto | null
  producer?: string | ReviewSubjectDto | null
  createdAt?: string
  reportedAt?: string
  report?: ReviewReportDto | null
  // Flat fallbacks for backends that do not nest the report.
  reportReason?: string
  reportNote?: string
  status?: string
  hidden?: boolean
}
