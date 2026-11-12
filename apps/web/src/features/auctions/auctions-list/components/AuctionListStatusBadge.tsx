import { Badge } from '@/components/ui/badge'
import { AUCTION_LIST_STATUS_LABELS } from '../auctions-list.labels'
import type { AuctionListStatus } from '../auctions-list.types'

export function AuctionListStatusBadge({ status }: { status: AuctionListStatus }) {
  if (status === 'active') {
    return (
      <Badge variant="live">
        <span aria-hidden="true" className="auctions-live-dot" />
        {AUCTION_LIST_STATUS_LABELS.active}
      </Badge>
    )
  }

  return (
    <Badge variant={status === 'ended' ? 'secondary' : 'outline'}>
      {AUCTION_LIST_STATUS_LABELS[status]}
    </Badge>
  )
}
