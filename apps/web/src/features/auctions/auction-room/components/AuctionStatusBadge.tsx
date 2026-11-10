import { Badge } from '@/components/ui/badge'
import { AUCTION_STATUS_LABELS } from '../auction-room.labels'
import type { AuctionStatus } from '../auction-room.types'

export function AuctionStatusBadge({ status }: { status: AuctionStatus }) {
  if (status === 'active') {
    return (
      <Badge className="bg-live text-live-foreground">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
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
