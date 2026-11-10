import { ApiError } from '@/services/api'
import type { ProducerOrderDto } from './producer-orders.dto'
import { canCancel, nextOrderStatus } from './producer-orders.labels'
import type { ProducerOrdersService } from './producer-orders.service'
import type { OrderStatus } from './producer-orders.types'
import { listMockOrders, updateMockOrderStatus } from './mocks/store'

const MOCK_LATENCY_MS = 500

// Set `ftt.producer-orders.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_ORDERS_ERROR_KEY = 'ftt.producer-orders.mock-error'
// Set `ftt.producer-orders.mock-empty` to `1` to exercise the empty state.
export const MOCK_ORDERS_EMPTY_KEY = 'ftt.producer-orders.mock-empty'
// Set `ftt.producer-orders.mock-update-error` to `1` to exercise a failed status change.
export const MOCK_ORDERS_UPDATE_ERROR_KEY = 'ftt.producer-orders.mock-update-error'

function wait(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })
}

function isFlagOn(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function parseStatus(value: unknown): OrderStatus {
  const statuses: OrderStatus[] = [
    'pending',
    'confirmed',
    'ready',
    'delivered',
    'cancelled',
  ]
  return statuses.includes(value as OrderStatus) ? (value as OrderStatus) : 'pending'
}

function isAllowedTransition(current: OrderStatus, next: OrderStatus): boolean {
  if (next === 'cancelled') return canCancel(current)
  return nextOrderStatus(current) === next
}

function notFound(): ApiError {
  return new ApiError(
    404,
    'ORDER_NOT_FOUND',
    'This order no longer exists. Refresh the list and try again.',
  )
}

export const producerOrdersMockService: ProducerOrdersService = {
  async listMine(): Promise<ProducerOrderDto[]> {
    await wait()

    if (isFlagOn(MOCK_ORDERS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Your orders could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_ORDERS_EMPTY_KEY)) return []

    return listMockOrders()
  },

  async updateStatus(id: string, status: OrderStatus): Promise<ProducerOrderDto> {
    await wait()

    if (isFlagOn(MOCK_ORDERS_UPDATE_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The status change could not be saved. Please try again.',
      )
    }

    const order = listMockOrders().find((entry) => entry.id === id || entry._id === id)
    if (!order) throw notFound()

    const current = parseStatus(order.status)
    if (!isAllowedTransition(current, status)) {
      throw new ApiError(
        400,
        'INVALID_STATUS_TRANSITION',
        'This order has already moved on. Refresh the list and try again.',
      )
    }

    const updated = updateMockOrderStatus(id, status)
    if (!updated) throw notFound()
    return updated
  },
}
