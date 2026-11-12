import { Badge } from '@/components/ui/badge'
import { AUCTION_STATUS_LABELS } from '../auction-room.labels'
import type { AuctionStatus } from '../auction-room.types'

export function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  if (status === 'active') {
    return (
      <Badge variant="live">
        <span aria-hidden="true" className="auctions-live-dot" />
        {AUCTION_STATUS_LABELS.active}
      </Badge>
    )
  }

  if (status === 'ended') {
    return <Badge variant="secondary">{AUCTION_STATUS_LABELS[status]}</Badge>
  }

  return <Badge variant="outline">{AUCTION_STATUS_LABELS[status]}</Badge>
}
