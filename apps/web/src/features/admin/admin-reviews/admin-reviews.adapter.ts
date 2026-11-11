import type { AdminReviewDto, ReviewSubjectDto } from './admin-reviews.dto'
import { reportReasonLabel } from './admin-reviews.labels'
import type { AdminReview, AdminReviewStatus } from './admin-reviews.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asDate(value: unknown): string | null {
  const date = asString(value)
  return date && !Number.isNaN(Date.parse(date)) ? date : null
}

function asRating(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.min(5, Math.max(1, Math.round(value)))
}

// The draft sends a name; also accept the object some endpoints use.
function asSubjectName(
  value: AdminReviewDto['product'] | AdminReviewDto['producer'],
): string | null {
  if (typeof value === 'string') return value.trim() || null
  if (value && typeof value === 'object') {
    const name = (value as ReviewSubjectDto).name
    if (typeof name === 'string' && name.trim()) return name.trim()
  }
  return null
}

function asStatus(dto: AdminReviewDto | null | undefined): AdminReviewStatus {
  if (dto?.hidden === true) return 'hidden'
  return asString(dto?.status).toLowerCase() === 'hidden' ? 'hidden' : 'reported'
}

export function adaptAdminReview(
  dto: AdminReviewDto | null | undefined,
  index = 0,
): AdminReview {
  const reportedAt = asDate(dto?.report?.reportedAt ?? dto?.reportedAt)

  return {
    id: asString(dto?.id || dto?._id, `review-${index + 1}`),
    author: asString(dto?.author, 'Anonymous buyer'),
    rating: asRating(dto?.rating),
    text: asString(dto?.text),
    product: asSubjectName(dto?.product),
    producer: asSubjectName(dto?.producer),
    createdAt: asDate(dto?.createdAt) ?? reportedAt,
    reportReason: reportReasonLabel(
      asString(dto?.report?.reason ?? dto?.reportReason),
    ),
    reportNote: asString(dto?.report?.note ?? dto?.reportNote) || null,
    reportedAt,
    status: asStatus(dto),
  }
}

export function adaptAdminReviews(
  dto: AdminReviewDto[] | null | undefined,
): AdminReview[] {
  const raw = Array.isArray(dto) ? dto : []
  return raw.map((review, index) => adaptAdminReview(review, index))
}
