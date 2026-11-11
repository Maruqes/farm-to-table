import {
  AUCTION_STATUS_LABELS,
  AUCTION_STATUS_ORDER,
} from '@/features/producer/producer-auctions/producer-auctions.labels'
import type {
  AdminAuctionStatus,
  AdminAuctionsStatusFilter,
} from './admin-auctions.types'

// Reuse the shared auction-state map instead of redefining the labels here.
export { AUCTION_STATUS_LABELS, AUCTION_STATUS_ORDER }

export const ADMIN_AUCTIONS_STATUS_FILTER_OPTIONS: {
  value: AdminAuctionsStatusFilter
  label: string
}[] = [
  { value: '', label: 'All statuses' },
  ...AUCTION_STATUS_ORDER.map((status: AdminAuctionStatus) => ({
    value: status,
    label: AUCTION_STATUS_LABELS[status],
  })),
]
