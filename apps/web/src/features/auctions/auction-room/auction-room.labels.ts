import type { AuctionStatus } from './auction-room.types'

export const AUCTION_STATUS_LABELS: Record<AuctionStatus, string> = {
  scheduled: 'Scheduled',
  active: 'Live',
  ended: 'Ended',
}
