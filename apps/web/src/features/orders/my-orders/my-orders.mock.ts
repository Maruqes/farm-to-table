import { ApiError } from '@/services/api'
import { adaptMyOrders } from './my-orders.adapter'
import type { MyOrderDto } from './my-orders.dto'
import type { MyOrdersService } from './my-orders.service'
import type { MyOrder, SubmitRatingInput } from './my-orders.types'
import { createMockOrders } from './mocks/orders'

const MOCK_LATENCY_MS = 550
const REVIEW_LATENCY_MS = 450
const REVIEWS_STORAGE_PREFIX = 'ftt.orders.reviews.'

// Set `ftt.orders.mock-error` to `1` in the browser to exercise the load error and retry states.
export const MOCK_ORDERS_ERROR_KEY = 'ftt.orders.mock-error'
// Set `ftt.orders.mock-empty` to `1` in the browser to exercise the empty state.
export const MOCK_ORDERS_EMPTY_KEY = 'ftt.orders.mock-empty'
// Set `ftt.orders.mock-review-error` to `1` to exercise a generic rating failure.
export const MOCK_REVIEW_ERROR_KEY = 'ftt.orders.mock-review-error'
// Set `ftt.orders.mock-review-conflict` to `1` to exercise the 409 "already rated" path.
export const MOCK_REVIEW_CONFLICT_KEY = 'ftt.orders.mock-review-conflict'

export interface StoredReview {
  rating: number
  text: string
}

type ReviewMap = Record<string, StoredReview>

function wait(ms = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function isFlagOn(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function reviewsStorageKey(userId: string): string {
  return `${REVIEWS_STORAGE_PREFIX}${userId}`
}

function readStoredReviews(userId: string): ReviewMap {
  try {
    const raw = localStorage.getItem(reviewsStorageKey(userId))
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    const reviews: ReviewMap = {}
    for (const [orderId, value] of Object.entries(parsed)) {
      if (!value || typeof value !== 'object') continue
      const rating = (value as { rating?: unknown }).rating
      const text = (value as { text?: unknown }).text
      if (typeof rating !== 'number' || !Number.isFinite(rating)) continue
      reviews[orderId] = {
        rating: Math.min(5, Math.max(1, Math.round(rating))),
        text: typeof text === 'string' ? text : '',
      }
    }
    return reviews
  } catch {
    return {}
  }
}

function writeStoredReviews(userId: string, reviews: ReviewMap): void {
  try {
    localStorage.setItem(reviewsStorageKey(userId), JSON.stringify(reviews))
  } catch {
    // The rating still applies for this session when storage is unavailable.
  }
}

function withStoredReviews(orders: MyOrderDto[], stored: ReviewMap): MyOrderDto[] {
  return orders.map((order) => {
    if (!order.id || !stored[order.id] || order.review) return order
    return {
      ...order,
      reviewed: true,
      review: {
        rating: stored[order.id].rating,
        text: stored[order.id].text,
      },
    }
  })
}

function validateInput(input: SubmitRatingInput): void {
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'Choose a rating from 1 to 5 stars.',
      { rating: 'Choose a rating from 1 to 5 stars.' },
    )
  }
  if (input.text.trim().length > 500) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'Keep your review under 500 characters.',
      { text: 'Keep your review under 500 characters.' },
    )
  }
}

export const myOrdersMockService: MyOrdersService = {
  async listMine(userId: string): Promise<MyOrder[]> {
    await wait()

    if (isFlagOn(MOCK_ORDERS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Your orders could not be loaded. Please try again.',
      )
    }
    if (isFlagOn(MOCK_ORDERS_EMPTY_KEY)) return []

    const orders = withStoredReviews(createMockOrders(), readStoredReviews(userId))
    return adaptMyOrders(orders)
  },

  async createReview(userId: string, input: SubmitRatingInput): Promise<void> {
    await wait(REVIEW_LATENCY_MS)

    if (isFlagOn(MOCK_REVIEW_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Your rating could not be saved. Please try again.',
      )
    }

    validateInput(input)

    const order = createMockOrders().find((entry) => entry.id === input.orderId)
    if (!order) {
      throw new ApiError(
        404,
        'ORDER_NOT_FOUND',
        'We could not find this order. Reload the page and try again.',
      )
    }
    if (order.status !== 'delivered') {
      throw new ApiError(
        409,
        'ORDER_NOT_DELIVERED',
        'This order can only be rated once it has been delivered.',
      )
    }

    const stored = readStoredReviews(userId)
    if (isFlagOn(MOCK_REVIEW_CONFLICT_KEY) || order.reviewed || order.review || stored[input.orderId]) {
      throw new ApiError(
        409,
        'ALREADY_REVIEWED',
        'This order has already been rated. Each order can only be rated once.',
      )
    }

    stored[input.orderId] = {
      rating: input.rating,
      text: input.text.trim(),
    }
    writeStoredReviews(userId, stored)
  },
}
