import type { ProducerReviewDto } from './producer-reviews.dto'
import type { ProducerReview } from './producer-reviews.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asRating(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.min(5, Math.max(1, Math.round(value)))
}

// The draft sends the product name; also accept the product object some endpoints use.
function asProductName(value: ProducerReviewDto['product']): string | null {
  if (typeof value === 'string') return value.trim() || null
  if (value && typeof value === 'object') {
    const name = value.name
    if (typeof name === 'string' && name.trim()) return name.trim()
  }
  return null
}

export function adaptProducerReview(
  dto: ProducerReviewDto | null | undefined,
  index = 0,
): ProducerReview {
  return {
    id: asString(dto?.id || dto?._id, `review-${index + 1}`),
    author: asString(dto?.author, 'Buyer'),
    rating: asRating(dto?.rating),
    text: asString(dto?.text),
    product: asProductName(dto?.product),
    reported: dto?.reported === true,
  }
}

export function adaptProducerReviews(
  dto: ProducerReviewDto[] | null | undefined,
): ProducerReview[] {
  const raw = Array.isArray(dto) ? dto : []
  return raw.map((review, index) => adaptProducerReview(review, index))
}
