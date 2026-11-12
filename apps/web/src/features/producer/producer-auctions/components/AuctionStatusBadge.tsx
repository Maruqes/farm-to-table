import { Badge } from '@/components/ui/badge'
import { AUCTION_STATUS_LABELS } from '../producer-auctions.labels'
import type { AuctionStatus } from '../producer-auctions.types'

export function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  if (status === 'active') {
    return (
      <Badge variant="live">
        <span aria-hidden="true" className="pa-live-dot" />
        {AUCTION_STATUS_LABELS.active}
      </Badge>
    )
  }

  return (
    <Badge variant={status === 'ended' ? 'secondary' : 'outline'}>
      {AUCTION_STATUS_LABELS[status]}
    </Badge>
  )
}
