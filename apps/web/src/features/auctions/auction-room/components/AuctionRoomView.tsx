import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSession } from '@/context/session'
import { lotNumber } from '@/components/crate'
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
    <article className="border-4 border-ink bg-board p-4 text-board-ink [--dim:color-mix(in_srgb,var(--board-ink)_60%,transparent)] [--ink:var(--board-ink)] [--paper:var(--board)] md:p-6">
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-amber pb-3 text-sm">
        <Link
          to="/auctions"
          className="inline-flex items-center gap-1"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to auctions
        </Link>
        <p className="mb-0 text-sm tabular opacity-75">
          lot {lotNumber(auction.id)} · {auction.viewerCount}{' '}
          {auction.viewerCount === 1 ? 'watcher' : 'watchers'}
        </p>
      </div>

      <header className="mt-4 flex flex-wrap items-start gap-4">
        <LotTile category={auction.product.category} />
        <div className="flex min-w-0 grow flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <AuctionStatusBadge status={auction.status} />
            <span className="text-sm tabular opacity-75">
              {auction.quantity} {auction.unit} lot
            </span>
          </div>
          <p className="mb-0 text-sm tabular opacity-75">lot {lotNumber(auction.id)}</p>
          <h1>{auction.product.name}</h1>
          <p className="mb-0 opacity-75">
            from{' '}
            {auction.producer.id ? (
              <Link
                to={`/producers/${auction.producer.id}`}
                className="font-semibold underline"
              >
                {auction.producer.name}
              </Link>
            ) : (
              <span className="font-semibold">{auction.producer.name}</span>
            )}
          </p>
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-6">
        <AuctionPanel
          auction={auction}
          user={user}
          bidding={bidding}
          bidError={bidError}
          onPlaceBid={onPlaceBid}
          onDismissBidError={onDismissBidError}
        />
        <BidHistory auction={auction} currentUserId={user?.id ?? ''} />
        <LotDetails auction={auction} />
      </div>
    </article>
  )
}
