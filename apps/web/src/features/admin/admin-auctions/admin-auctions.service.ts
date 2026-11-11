import { USE_MOCKS } from '@/services/env'
import type { AdminAuctionsPageDto } from './admin-auctions.dto'
import { adminAuctionsHttpService } from './admin-auctions.http'
import { adminAuctionsMockService } from './admin-auctions.mock'
import type { AdminAuctionsFilters } from './admin-auctions.types'

export interface AdminAuctionsService {
  list(
    filters: AdminAuctionsFilters,
    page: number,
  ): Promise<AdminAuctionsPageDto>
}

export const adminAuctionsService: AdminAuctionsService = USE_MOCKS
  ? adminAuctionsMockService
  : adminAuctionsHttpService
