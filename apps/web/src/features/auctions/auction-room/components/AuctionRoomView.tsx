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
    <article className="room p-3 p-md-4">
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>

      <div className="room-topbar">
        <Link
          to="/"
          className="d-inline-flex align-items-center gap-1"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to catalog
        </Link>
        <p className="tabular small opacity-75 mb-0">
          lot {lotNumber(auction.id)} · {auction.viewerCount}{' '}
          {auction.viewerCount === 1 ? 'watcher' : 'watchers'}
        </p>
      </div>

      <header className="room-header">
        <LotTile category={auction.product.category} />
        <div className="flex-grow-1 min-w-0 vstack gap-1">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <AuctionStatusBadge status={auction.status} />
            <span className="small tabular opacity-75">
              {auction.quantity} {auction.unit} lot
            </span>
          </div>
          <p className="small tabular opacity-75 mb-0">lot {lotNumber(auction.id)}</p>
          <h1>{auction.product.name}</h1>
          <p className="opacity-75 mb-0">
            from{' '}
            {auction.producer.id ? (
              <Link
                to={`/producers/${auction.producer.id}`}
                className="fw-semibold text-decoration-underline"
              >
                {auction.producer.name}
              </Link>
            ) : (
              <span className="fw-semibold">{auction.producer.name}</span>
            )}
          </p>
        </div>
      </header>

      <div className="mt-4 vstack gap-4">
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
