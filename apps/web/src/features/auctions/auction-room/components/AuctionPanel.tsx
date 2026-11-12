import { Link } from 'react-router-dom'
import { Eye, Gavel, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SessionUser } from '@/context/session'
import { formatDateTime, formatMoney } from '@/services/format'
import type { AuctionRoom, PlaceBidResult } from '../auction-room.types'
import { useNow } from '../useNow'
import { BidForm } from './BidForm'
import { Countdown } from './Countdown'

interface AuctionPanelProps {
  auction: AuctionRoom
  user: SessionUser | null
  bidding: boolean
  bidError: string | null
  onPlaceBid: (amount: number) => Promise<PlaceBidResult>
  onDismissBidError: () => void
}

function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100
}

function isTimeUp(auction: AuctionRoom, now: number): boolean {
  if (auction.status !== 'active' || !auction.endsAt) return false
  const ends = Date.parse(auction.endsAt)
  return !Number.isNaN(ends) && ends <= now
}

function BidErrorAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div role="alert" className="room-error">
      <p className="mb-0">{message}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        aria-label="Dismiss bid error"
      >
        <X size={16} aria-hidden="true" />
      </Button>
    </div>
  )
}

function AuctionResult({ auction, user }: { auction: AuctionRoom; user: SessionUser | null }) {
  if (auction.winner) {
    const youWon = user?.id === auction.winner.id

    return (
      <div className="vstack gap-2">
        <h3 className="fs-4">Auction ended</h3>
        <p className="mb-0">
          {youWon ? 'You won this lot' : `${auction.winner.name} won this lot`} for{' '}
          <data value={auction.currentPrice} className="fw-semibold tabular room-highlight">
            {formatMoney(auction.currentPrice)}
          </data>
          .
        </p>
        <p className="small opacity-75 mb-0">
          {youWon
            ? 'The producer will contact you about pickup or delivery.'
            : 'The winning bidder is charged with the card saved in their profile.'}
        </p>
      </div>
    )
  }

  return (
    <div className="vstack gap-2">
      <h3 className="fs-4">Auction ended</h3>
      <p className="fw-semibold mb-0">No winner</p>
      <p className="small opacity-75 mb-0">
        {auction.bids.length === 0
          ? 'No bids were placed before the clock ran out.'
          : 'The highest bidder could not complete payment, so this lot closed without a winner.'}
      </p>
    </div>
  )
}

function ScheduledNotice({ auction }: { auction: AuctionRoom }) {
  return (
    <div className="vstack gap-2">
      <h3 className="fs-4">Bidding opens soon</h3>
      <p className="small opacity-75 mb-0">
        {auction.startsAt ? (
          <>
            This lot opens at{' '}
            <time dateTime={auction.startsAt}>{formatDateTime(auction.startsAt)}</time>.
          </>
        ) : (
          'This lot has not opened for bidding yet.'
        )}
      </p>
      <p className="small opacity-75 mb-0">
        The starting price is {formatMoney(auction.basePrice)}.
      </p>
    </div>
  )
}

function VisitorPrompt() {
  return (
    <div className="vstack gap-3">
      <h3 className="fs-4">Want to bid?</h3>
      <p className="small opacity-75 mb-0">
        Log in with a buyer account to place a bid. You can keep watching this auction
        read-only.
      </p>
      <Button asChild variant="amber">
        <Link to="/login">Log in to bid</Link>
      </Button>
    </div>
  )
}

export function AuctionPanel({
  auction,
  user,
  bidding,
  bidError,
  onPlaceBid,
  onDismissBidError,
}: AuctionPanelProps) {
  const now = useNow()
  const minimum = roundMoney(auction.currentPrice + auction.increment)
  const timeUp = isTimeUp(auction, now)
  const priceLabel =
    auction.status === 'scheduled' || (auction.status === 'ended' && auction.bids.length === 0)
      ? 'Starting price'
      : auction.status === 'ended'
        ? 'Final price'
        : 'Current bid'

  return (
    <section aria-labelledby="auction-bidding-heading">
      <h2 id="auction-bidding-heading" className="visually-hidden">
        Auction bidding
      </h2>

      <div className="room-panel-top">
        <Countdown auction={auction} now={now} />

        <div className="flex-grow-1 min-w-0 vstack gap-1">
          <p className="small opacity-75 mb-0">{priceLabel}</p>
          <data
            value={auction.currentPrice}
            className="room-current-bid tabular"
          >
            {formatMoney(auction.currentPrice)}
          </data>
          <p className="small opacity-75 mb-0">
            {auction.status === 'ended' ? (
              auction.winner ? (
                <>
                  Won by <span className="fw-semibold">{auction.winner.name}</span>
                </>
              ) : (
                'No winner'
              )
            ) : auction.leader ? (
              <>
                Leading: <span className="fw-semibold">{auction.leader.name}</span>
              </>
            ) : (
              'No bids yet'
            )}
          </p>
        </div>
      </div>

      <div className="room-stats">
        <span className="room-stat">
          <Eye size={16} aria-hidden="true" />
          <data value={auction.viewerCount} className="fw-semibold tabular">
            {auction.viewerCount}
          </data>
          watching
        </span>
        <span className="room-stat">
          <Gavel size={16} aria-hidden="true" />
          <data value={auction.bids.length} className="fw-semibold tabular">
            {auction.bids.length}
          </data>
          {auction.bids.length === 1 ? 'bid' : 'bids'}
        </span>
        {auction.status === 'active' && !timeUp && (
          <span>
            Minimum bid{' '}
            <data value={minimum} className="fw-semibold tabular">
              {formatMoney(minimum)}
            </data>
          </span>
        )}
      </div>

      <div className="mt-4 border-top pt-4">
        {bidError && <BidErrorAlert message={bidError} onDismiss={onDismissBidError} />}

        {auction.status === 'ended' ? (
          <AuctionResult auction={auction} user={user} />
        ) : auction.status === 'scheduled' ? (
          <ScheduledNotice auction={auction} />
        ) : timeUp ? (
          <div className="vstack gap-2">
            <h3 className="fs-4">Time is up</h3>
            <p className="small opacity-75 mb-0">
              Bids are closed. Waiting for the final result from the server…
            </p>
          </div>
        ) : !user ? (
          <VisitorPrompt />
        ) : user.id === auction.producer.id ? (
          <div className="vstack gap-2">
            <h3 className="fs-4">This is your lot</h3>
            <p className="small opacity-75 mb-0">
              You can follow the bids, but you cannot bid on your own auction.
            </p>
          </div>
        ) : user.role !== 'buyer' ? (
          <div className="vstack gap-2">
            <h3 className="fs-4">Read-only</h3>
            <p className="small opacity-75 mb-0">
              Only buyer accounts can place bids. You can watch this auction read-only.
            </p>
          </div>
        ) : (
          <BidForm
            auction={auction}
            bidding={bidding}
            onPlaceBid={onPlaceBid}
            onEdit={onDismissBidError}
          />
        )}
      </div>
    </section>
  )
}
