// Domain model consumed by components and hooks. API shapes stay in auctions-list.dto.ts.

export const AUCTION_LIST_STATUSES = ['active', 'scheduled', 'ended'] as const

export type AuctionListStatus = (typeof AUCTION_LIST_STATUSES)[number]

export interface AuctionListItem {
  id: string
  productId: string
  productName: string
  category: string
  currentPrice: number
  endsAt: string | null
  viewers: number
  status: AuctionListStatus
}

export interface AuctionsListQuery {
  status: AuctionListStatus
}
