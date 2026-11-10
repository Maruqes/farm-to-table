import type { AuctionStatus } from './producer-auctions.types'

// One shared map for every auction state, as DESIGN.md requires.
export const AUCTION_STATUS_LABELS: Record<AuctionStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  active: 'Live',
  ended: 'Ended',
}

export const AUCTION_STATUS_ORDER: AuctionStatus[] = [
  'draft',
  'scheduled',
  'active',
  'ended',
]

export const AUCTION_STATUS_DESCRIPTIONS: Record<AuctionStatus, string> = {
  draft: 'Not published yet. Only you can see these.',
  scheduled: 'Published and waiting for the start time.',
  active: 'Bidding is open now.',
  ended: 'Finished. Results stay here for your records.',
}

export interface DurationOption {
  value: string
  label: string
}

export const DURATION_OPTIONS: DurationOption[] = [
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '1 hour' },
  { value: 'custom', label: 'Custom length' },
]

export function auctionStatusLabel(status: AuctionStatus): string {
  return AUCTION_STATUS_LABELS[status]
}
