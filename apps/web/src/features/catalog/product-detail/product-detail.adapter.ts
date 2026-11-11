import type {
  ProductDetailDto,
  ProducerSummaryDto,
  ReviewDto,
} from './product-detail.dto'
import type { ProductDetail, ProducerSummary, Review } from './product-detail.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asRating(value: unknown): number {
  return Math.min(5, Math.max(0, asNumber(value)))
}

function adaptProducer(dto: ProducerSummaryDto | null | undefined): ProducerSummary {
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Local producer'),
    location: asString(dto?.location),
  }
}

function adaptReview(dto: ReviewDto | null | undefined, index: number): Review {
  const author = asString(dto?.author, 'Anonymous')
  const date = asString(dto?.date)
  return {
    id: asString(dto?.id || dto?._id, `${author}-${date}-${index}`),
    author,
    rating: asRating(dto?.rating),
    text: asString(dto?.text),
    date,
  }
}

export function adaptProductDetail(
  dto: ProductDetailDto | null | undefined,
): ProductDetail {
  const reviews = Array.isArray(dto?.reviews) ? dto.reviews : []
  return {
    id: asString(dto?.id || dto?._id),
    name: asString(dto?.name, 'Unnamed product'),
    price: asNumber(dto?.price),
    unit: asString(dto?.unit, 'unit'),
    stock: Math.max(0, Math.floor(asNumber(dto?.stock))),
    category: asString(dto?.category, 'other'),
    imageUrl: asString(dto?.imageUrl),
    producer: adaptProducer(dto?.producer),
    averageRating: asRating(dto?.averageRating),
    description: asString(dto?.description),
    reviews: reviews.map(adaptReview),
  }
}
