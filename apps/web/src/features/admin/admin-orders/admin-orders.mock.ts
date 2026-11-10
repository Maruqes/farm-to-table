import { ApiError } from '@/services/api'
import type { AdminOrdersPageDto } from './admin-orders.dto'
import type { AdminOrdersService } from './admin-orders.service'
import {
  ADMIN_ORDERS_PAGE_SIZE,
  type AdminOrdersFilters,
} from './admin-orders.types'
import { listMockOrders } from './mocks/orders'

const MOCK_LATENCY_MS = 450

// Set `ftt.admin-orders.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_ADMIN_ORDERS_ERROR_KEY = 'ftt.admin-orders.mock-error'
// Set `ftt.admin-orders.mock-empty` to `1` to exercise the empty state.
export const MOCK_ADMIN_ORDERS_EMPTY_KEY = 'ftt.admin-orders.mock-empty'

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function isFlagOn(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export const adminOrdersMockService: AdminOrdersService = {
  async list(
    filters: AdminOrdersFilters,
    page: number,
  ): Promise<AdminOrdersPageDto> {
    await wait(MOCK_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_ORDERS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Orders could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_ADMIN_ORDERS_EMPTY_KEY)) return { items: [], total: 0 }

    const filtered = listMockOrders().filter(
      (order) => !filters.status || order.status === filters.status,
    )

    const start = (Math.max(1, page) - 1) * ADMIN_ORDERS_PAGE_SIZE
    return {
      items: filtered.slice(start, start + ADMIN_ORDERS_PAGE_SIZE),
      total: filtered.length,
    }
  },
}
