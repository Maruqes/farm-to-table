import {
  hideReportedReview,
  keepReportedReview,
  listReportedReviewsForAdmin,
  type AdminReviewDto,
} from '../reviews/reviews.service.js'

// Reads and writes go through the reviews service; this module only shapes the admin endpoints.
export async function listAdminReviews(): Promise<AdminReviewDto[]> {
  return listReportedReviewsForAdmin()
}

export async function keepAdminReview(id: string): Promise<AdminReviewDto> {
  return keepReportedReview(id)
}

export async function hideAdminReview(id: string): Promise<AdminReviewDto> {
  return hideReportedReview(id)
}
