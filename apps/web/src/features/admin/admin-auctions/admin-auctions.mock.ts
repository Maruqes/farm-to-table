import { ApiError } from '@/services/api'
import type { AdminAuctionsPageDto } from './admin-auctions.dto'
import type { AdminAuctionsService } from './admin-auctions.service'
import {
  ADMIN_AUCTIONS_PAGE_SIZE,
  type AdminAuctionsFilters,
} from './admin-auctions.types'
import { listMockAuctions } from './mocks/auctions'

const MOCK_LATENCY_MS = 450

// Set `ftt.admin-auctions.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_ADMIN_AUCTIONS_ERROR_KEY = 'ftt.admin-auctions.mock-error'
// Set `ftt.admin-auctions.mock-empty` to `1` to exercise the empty state.
export const MOCK_ADMIN_AUCTIONS_EMPTY_KEY = 'ftt.admin-auctions.mock-empty'

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

export const adminAuctionsMockService: AdminAuctionsService = {
  async list(
    filters: AdminAuctionsFilters,
    page: number,
  ): Promise<AdminAuctionsPageDto> {
    await wait(MOCK_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_AUCTIONS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Auctions could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_ADMIN_AUCTIONS_EMPTY_KEY)) return { items: [], total: 0 }

    const filtered = listMockAuctions().filter(
      (auction) => !filters.status || auction.status === filters.status,
    )

    const start = (Math.max(1, page) - 1) * ADMIN_AUCTIONS_PAGE_SIZE
    return {
      items: filtered.slice(start, start + ADMIN_AUCTIONS_PAGE_SIZE),
      total: filtered.length,
    }
  },
}
