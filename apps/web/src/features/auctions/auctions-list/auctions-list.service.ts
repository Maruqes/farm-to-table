import { USE_MOCKS } from '@/services/env'
import type { AuctionListItem, AuctionsListQuery } from './auctions-list.types'
import { auctionsListHttpService } from './auctions-list.http'
import { auctionsListMockService } from './auctions-list.mock'

export interface AuctionsListService {
  listAuctions(query: AuctionsListQuery): Promise<AuctionListItem[]>
}

export const auctionsListService: AuctionsListService = USE_MOCKS
  ? auctionsListMockService
  : auctionsListHttpService
