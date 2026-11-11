import mongoose from 'mongoose'
import { ApiError } from '../../lib/api-error.js'
import { round2 } from '../../lib/money.js'
import { getBuyerOrderForReview } from '../orders/orders.service.js'
import { ProductModel } from '../products/products.model.js'
import { UserModel } from '../users/users.model.js'
import { ReviewModel, type ReviewDoc } from './reviews.model.js'
import type { CreateReviewInput } from './reviews.schemas.js'

const PRODUCT_REVIEWS_LIMIT = 50

type Review = ReviewDoc & { _id: unknown }

export interface CreatedReviewDto {
  id: string
  orderId: string
  rating: number
  text: string
  createdAt: string
}

export interface ProductReviewDto {
  id: string
  author: string
  rating: number
  text: string
  date: string
}

export interface ProducerReviewDto {
  id: string
  author: string
  rating: number
  text: string
  product: string | null
  reported: boolean
}

export interface MyReviewDto {
  rating: number
  text: string
}

export interface AdminReviewDto {
  id: string
  author: string
  rating: number
  text: string
  product: string | null
  producer: string | null
  createdAt: string
  report: {
    reason: string
    note?: string
    reportedAt: string
  }
  status: 'reported' | 'hidden'
}

const ADMIN_QUEUE_LIMIT = 200

type AdminNameMaps = { authors: Map<string, string>, producers: Map<string, string> }

async function adminNameMaps(reviews: Review[]): Promise<AdminNameMaps> {
  const buyerIds = [...new Set(reviews.map((r) => String(r.buyer)))]
  const producerIds = [...new Set(reviews.map((r) => String(r.producer)))]
  const [buyers, producers] = await Promise.all([
    buyerIds.length ? UserModel.find({ _id: { $in: buyerIds } }).select('name').lean() : [],
    producerIds.length ? UserModel.find({ _id: { $in: producerIds } }).select('name producer').lean() : [],
  ])
  return {
    authors: new Map(buyers.map((b) => [String(b._id), b.name])),
    producers: new Map(producers.map((p) => [String(p._id), p.producer?.farmName ?? p.name])),
  }
}

function toAdminReviewDto(review: Review, names: AdminNameMaps): AdminReviewDto {
  const dto: AdminReviewDto = {
    id: String(review._id),
    author: names.authors.get(String(review.buyer)) ?? '',
    rating: review.rating,
    text: review.text,
    product: review.productName ?? null,
    producer: names.producers.get(String(review.producer)) ?? null,
    createdAt: new Date(review.createdAt).toISOString(),
    report: {
      reason: review.report?.reason ?? '',
      reportedAt: review.report ? new Date(review.report.reportedAt).toISOString() : new Date(review.createdAt).toISOString(),
    },
    status: review.hidden === true ? 'hidden' : 'reported',
  }
  if (review.report && 'note' in review.report && typeof (review.report as { note?: unknown }).note === 'string') {
    dto.report.note = (review.report as { note: string }).note
  }
  return dto
}

// The moderation queue: reviews with an open report plus hidden ones, newest report first.
const IN_QUEUE = { $or: [{ 'report.open': true }, { hidden: true }] }

export async function listReportedReviewsForAdmin(): Promise<AdminReviewDto[]> {
  const reviews: Review[] = await ReviewModel.find(IN_QUEUE)
    .sort({ 'report.reportedAt': -1, _id: -1 })
    .limit(ADMIN_QUEUE_LIMIT)
    .lean()
  if (!reviews.length) return []
  const names = await adminNameMaps(reviews)
  return reviews.map((review) => toAdminReviewDto(review, names))
}

async function adminReviewById(
  id: string,
  filter: Record<string, unknown>,
  update: Record<string, unknown>,
): Promise<AdminReviewDto> {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Review not found')
  const updated: Review | null = await ReviewModel.findOneAndUpdate(
    { _id: id, ...filter },
    update,
    { returnDocument: 'after' },
  ).lean()
  if (!updated) throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Review not found')
  return toAdminReviewDto(updated, await adminNameMaps([updated]))
}

// Dismisses an open report; the review stays public and leaves the queue.
// A review that is already hidden has no open report, so keeping it is a 404.
export async function keepReportedReview(id: string): Promise<AdminReviewDto> {
  return adminReviewById(id, { 'report.open': true }, { $set: { 'report.open': false } })
}

// Hides the review and closes the report; hidden reviews stay in the queue marked Hidden.
export async function hideReportedReview(id: string): Promise<AdminReviewDto> {
  const dto = await adminReviewById(id, IN_QUEUE, { $set: { hidden: true, 'report.open': false } })
  const updated: Review | null = await ReviewModel.findById(dto.id).lean()
  if (updated) await recomputeRatings(String(updated.producer), updated.products.map(String))
  return dto
}

function toCreatedReviewDto(review: Review): CreatedReviewDto {
  return {
    id: String(review._id),
    orderId: String(review.order),
    rating: review.rating,
    text: review.text,
    createdAt: new Date(review.createdAt).toISOString(),
  }
}

function toProducerReviewDto(review: Review, author: string): ProducerReviewDto {
  return {
    id: String(review._id),
    author,
    rating: review.rating,
    text: review.text,
    product: review.productName ?? null,
    reported: review.report?.open === true,
  }
}

function isDuplicateKey(err: unknown): boolean {
  return (err as { code?: unknown } | null)?.code === 11000
}

export async function createReview(buyerId: string, input: CreateReviewInput): Promise<CreatedReviewDto> {
  const order = await getBuyerOrderForReview(buyerId, input.orderId)
  if (!order) throw new ApiError(404, 'ORDER_NOT_FOUND', 'Order not found')
  if (order.status !== 'delivered') throw new ApiError(409, 'ORDER_NOT_DELIVERED', 'Order not delivered')

  const productIds = [...new Set(order.items.map((item) => item.productId))]
  let created: Review
  try {
    created = (
      await ReviewModel.create({
        order: input.orderId,
        buyer: buyerId,
        producer: order.producer,
        products: productIds,
        productName: order.items.length === 1 ? order.items[0]!.name : null,
        rating: input.rating,
        text: input.text ?? '',
      })
    ).toObject() as Review
  } catch (err) {
    if (isDuplicateKey(err)) throw new ApiError(409, 'ALREADY_REVIEWED', 'Order already reviewed')
    throw err
  }

  await recomputeRatings(order.producer, productIds)
  return toCreatedReviewDto(created)
}

async function ratingStats(filter: Record<string, unknown>): Promise<{ averageRating: number, ratingCount: number }> {
  const [row] = await ReviewModel.aggregate<{ averageRating: number, ratingCount: number }>([
    { $match: { ...filter, hidden: { $ne: true } } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, ratingCount: { $sum: 1 } } },
  ])
  return row ? { averageRating: round2(row.averageRating), ratingCount: row.ratingCount } : { averageRating: 0, ratingCount: 0 }
}

// Hidden reviews disappear from the averages. BE-19 calls this again after keeping or hiding one.
export async function recomputeRatings(producerId: string, productIds: string[] = []): Promise<void> {
  const ids = [...new Set(productIds)].filter((id) => mongoose.isValidObjectId(id))
  const [producerStats, ...productStats] = await Promise.all([
    ratingStats({ producer: new mongoose.Types.ObjectId(producerId) }),
    ...ids.map((id) => ratingStats({ products: new mongoose.Types.ObjectId(id) })),
  ])

  await Promise.all([
    UserModel.updateOne(
      { _id: producerId },
      { $set: { 'producer.averageRating': producerStats.averageRating, 'producer.ratingCount': producerStats.ratingCount } },
    ),
    ...ids.map((id, index) =>
      ProductModel.updateOne(
        { _id: id },
        { $set: { averageRating: productStats[index]!.averageRating, ratingCount: productStats[index]!.ratingCount } },
      ),
    ),
  ])
}

export async function listProductReviews(productId: string): Promise<ProductReviewDto[]> {
  if (!mongoose.isValidObjectId(productId)) return []
  const reviews: Review[] = await ReviewModel.find({ products: productId, hidden: { $ne: true } })
    .sort({ createdAt: -1, _id: -1 })
    .limit(PRODUCT_REVIEWS_LIMIT)
    .lean()
  if (!reviews.length) return []
  const buyers = await UserModel.find({ _id: { $in: reviews.map((r) => r.buyer) } }).select('name').lean()
  const names = new Map(buyers.map((b) => [String(b._id), b.name]))
  return reviews.map((review) => ({
    id: String(review._id),
    author: names.get(String(review.buyer)) ?? '',
    rating: review.rating,
    text: review.text,
    date: new Date(review.createdAt).toISOString(),
  }))
}

export async function listProducerReviews(producerId: string): Promise<ProducerReviewDto[]> {
  const reviews: Review[] = await ReviewModel.find({ producer: producerId, hidden: { $ne: true } })
    .sort({ createdAt: -1, _id: -1 })
    .lean()
  if (!reviews.length) return []
  const buyers = await UserModel.find({ _id: { $in: reviews.map((r) => r.buyer) } }).select('name').lean()
  const names = new Map(buyers.map((b) => [String(b._id), b.name]))
  return reviews.map((review) => toProducerReviewDto(review, names.get(String(review.buyer)) ?? ''))
}

// Reporting is idempotent: the first reason and timestamp are kept.
export async function reportReview(producerId: string, id: string, reason: string): Promise<ProducerReviewDto> {
  const updated: Review | null = mongoose.isValidObjectId(id)
    ? await ReviewModel.findOneAndUpdate(
        { _id: id, producer: producerId, 'report.open': { $ne: true } },
        { $set: { report: { reason, reportedAt: new Date(), open: true } } },
        { returnDocument: 'after' },
      ).lean()
    : null

  let review = updated
  if (!review) {
    const existing: Review | null = mongoose.isValidObjectId(id) ? await ReviewModel.findOne({ _id: id }).lean() : null
    if (!existing) throw new ApiError(404, 'REVIEW_NOT_FOUND', 'Review not found')
    if (String(existing.producer) !== producerId) throw new ApiError(403, 'FORBIDDEN', 'Not your review')
    review = existing
  }

  const buyer = await UserModel.findById(review.buyer).select('name').lean()
  return toProducerReviewDto(review, buyer?.name ?? '')
}

type MyReviewRow = { order: unknown, rating: number, text: string }

export async function reviewsByOrder(buyerId: string, orderIds: string[]): Promise<Map<string, MyReviewDto>> {
  if (!orderIds.length) return new Map()
  const reviews: MyReviewRow[] = await ReviewModel.find({ buyer: buyerId, order: { $in: orderIds } })
    .select('order rating text')
    .lean()
  return new Map(reviews.map((review) => [String(review.order), { rating: review.rating, text: review.text }]))
}
