// Domain model consumed by components and hooks. API shapes stay in admin-auctions.dto.ts.

import type { AuctionStatus } from '@/features/producer/producer-auctions/producer-auctions.types'

// The admin list shows every auction state used elsewhere in the app.
export type AdminAuctionStatus = AuctionStatus

export type AdminAuctionsStatusFilter = AdminAuctionStatus | ''

export interface AdminAuction {
  id: string
  productName: string
  producerName: string
  status: AdminAuctionStatus
  currentPrice: number
  bidCount: number
  startsAt: string | null
  endsAt: string | null
}

export interface AdminAuctionsPage {
  items: AdminAuction[]
  total: number
}

export interface AdminAuctionsFilters {
  status: AdminAuctionsStatusFilter
}

// The assumed API paginates with this fixed page size; the mock mirrors it.
export const ADMIN_AUCTIONS_PAGE_SIZE = 8
