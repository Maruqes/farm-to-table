import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSession } from '@/context/session'
import type { AuctionRoom, PlaceBidResult } from '../auction-room.types'
import { AuctionPanel } from './AuctionPanel'
import { AuctionStatusBadge } from './AuctionStatusBadge'
import { BidHistory } from './BidHistory'
import { LotDetails } from './LotDetails'
import { LotTile } from './LotTile'

interface AuctionRoomViewProps {
  auction: AuctionRoom
  bidding: boolean
  bidError: string | null
  announcement: string
  onPlaceBid: (amount: number) => Promise<PlaceBidResult>
  onDismissBidError: () => void
}

export function AuctionRoomView({
  auction,
  bidding,
  bidError,
  announcement,
  onPlaceBid,
  onDismissBidError,
}: AuctionRoomViewProps) {
  const { user } = useSession()

  return (
    <article className="space-y-6 md:space-y-8">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to catalog
      </Link>

      <header className="flex flex-wrap items-start gap-4">
        <LotTile category={auction.product.category} className="size-16 md:size-20" />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <AuctionStatusBadge status={auction.status} />
            <span className="text-sm text-muted-foreground tabular">
              {auction.quantity} {auction.unit} lot
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl">{auction.product.name}</h1>
          <p className="text-muted-foreground">
            from{' '}
            {auction.producer.id ? (
              <Link
                to={`/producers/${auction.producer.id}`}
                className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary"
              >
                {auction.producer.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{auction.producer.name}</span>
            )}
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-8">
        <div className="space-y-8">
          <AuctionPanel
            auction={auction}
            user={user}
            bidding={bidding}
            bidError={bidError}
            onPlaceBid={onPlaceBid}
            onDismissBidError={onDismissBidError}
          />
          <BidHistory auction={auction} currentUserId={user?.id ?? ''} />
        </div>

        <LotDetails auction={auction} />
      </div>
    </article>
  )
}
