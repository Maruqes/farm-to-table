import { ApiError } from '@/services/api'
import { adaptAuctionsList } from './auctions-list.adapter'
import type { AuctionListItemDto } from './auctions-list.dto'
import type { AuctionsListService } from './auctions-list.service'
import type { AuctionListItem, AuctionsListQuery } from './auctions-list.types'
import { createMockAuctionList } from './mocks/auctions'

const MOCK_LATENCY_MS = 450

export const MOCK_AUCTIONS_LIST_ERROR_KEY = 'ftt.auctions-list.mock-error'
export const MOCK_AUCTIONS_LIST_EMPTY_KEY = 'ftt.auctions-list.mock-empty'

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

function endsAtTime(record: AuctionListItemDto): number {
  const parsed = record.endsAt ? Date.parse(record.endsAt) : Number.NaN
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed
}

// Live and scheduled lots read soonest-first; ended lots read most recent first.
function sortForStatus(
  records: AuctionListItemDto[],
  status: AuctionsListQuery['status'],
): AuctionListItemDto[] {
  const sorted = [...records]
  if (status === 'ended') {
    sorted.sort((left, right) => endsAtTime(right) - endsAtTime(left))
  } else {
    sorted.sort((left, right) => endsAtTime(left) - endsAtTime(right))
  }
  return sorted
}

export const auctionsListMockService: AuctionsListService = {
  async listAuctions(query: AuctionsListQuery): Promise<AuctionListItem[]> {
    await wait()

    if (isFlagOn(MOCK_AUCTIONS_LIST_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'The auctions could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_AUCTIONS_LIST_EMPTY_KEY)) return []

    const records = createMockAuctionList().filter(
      (record) => record.status === query.status,
    )

    return adaptAuctionsList(sortForStatus(records, query.status))
  },
}
