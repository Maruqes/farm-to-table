import type { AuctionListStatus } from './auctions-list.types'

export const AUCTION_LIST_STATUS_LABELS: Record<AuctionListStatus, string> = {
  active: 'Live',
  scheduled: 'Scheduled',
  ended: 'Ended',
}
