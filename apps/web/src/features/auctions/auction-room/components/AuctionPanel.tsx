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
    <div role="alert" className="mb-4 flex items-start justify-between gap-3 border-2 border-alarm p-3 text-sm">
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
      <div className="flex flex-col gap-2">
        <h3 className="text-2xl">Auction ended</h3>
        <p className="mb-0">
          {youWon ? 'You won this lot' : `${auction.winner.name} won this lot`} for{' '}
          <data value={auction.currentPrice} className="font-semibold tabular text-amber">
            {formatMoney(auction.currentPrice)}
          </data>
          .
        </p>
        <p className="mb-0 text-sm opacity-75">
          {youWon
            ? 'The producer will contact you about pickup or delivery.'
            : 'The winning bidder is charged with the card saved in their profile.'}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-2xl">Auction ended</h3>
      <p className="mb-0 font-semibold">No winner</p>
      <p className="mb-0 text-sm opacity-75">
        {auction.bids.length === 0
          ? 'No bids were placed before the clock ran out.'
          : 'The highest bidder could not complete payment, so this lot closed without a winner.'}
      </p>
    </div>
  )
}

function ScheduledNotice({ auction }: { auction: AuctionRoom }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-2xl">Bidding opens soon</h3>
      <p className="mb-0 text-sm opacity-75">
        {auction.startsAt ? (
          <>
            This lot opens at{' '}
            <time dateTime={auction.startsAt}>{formatDateTime(auction.startsAt)}</time>.
          </>
        ) : (
          'This lot has not opened for bidding yet.'
        )}
      </p>
      <p className="mb-0 text-sm opacity-75">
        The starting price is {formatMoney(auction.basePrice)}.
      </p>
    </div>
  )
}

function VisitorPrompt() {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-2xl">Want to bid?</h3>
      <p className="mb-0 text-sm opacity-75">
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
      <h2 id="auction-bidding-heading" className="sr-only">
        Auction bidding
      </h2>

      <div className="flex flex-wrap items-center gap-6">
        <Countdown auction={auction} now={now} />

        <div className="flex min-w-0 grow flex-col gap-1">
          <p className="mb-0 text-sm opacity-75">{priceLabel}</p>
          <data
            value={auction.currentPrice}
            className="font-display text-[2.75rem] leading-none normal-case tabular whitespace-nowrap text-amber md:text-[3.5rem]"
          >
            {formatMoney(auction.currentPrice)}
          </data>
          <p className="mb-0 text-sm opacity-75">
            {auction.status === 'ended' ? (
              auction.winner ? (
                <>
                  Won by <span className="font-semibold">{auction.winner.name}</span>
                </>
              ) : (
                'No winner'
              )
            ) : auction.leader ? (
              <>
                Leading: <span className="font-semibold">{auction.leader.name}</span>
              </>
            ) : (
              'No bids yet'
            )}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink pt-4 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <Eye size={16} aria-hidden="true" />
          <data value={auction.viewerCount} className="font-semibold tabular">
            {auction.viewerCount}
          </data>
          watching
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Gavel size={16} aria-hidden="true" />
          <data value={auction.bids.length} className="font-semibold tabular">
            {auction.bids.length}
          </data>
          {auction.bids.length === 1 ? 'bid' : 'bids'}
        </span>
        {auction.status === 'active' && !timeUp && (
          <span>
            Minimum bid{' '}
            <data value={minimum} className="font-semibold tabular">
              {formatMoney(minimum)}
            </data>
          </span>
        )}
      </div>

      <div className="mt-6 border-t border-ink pt-6">
        {bidError && <BidErrorAlert message={bidError} onDismiss={onDismissBidError} />}

        {auction.status === 'ended' ? (
          <AuctionResult auction={auction} user={user} />
        ) : auction.status === 'scheduled' ? (
          <ScheduledNotice auction={auction} />
        ) : timeUp ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl">Time is up</h3>
            <p className="mb-0 text-sm opacity-75">
              Bids are closed. Waiting for the final result from the server…
            </p>
          </div>
        ) : !user ? (
          <VisitorPrompt />
        ) : user.id === auction.producer.id ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl">This is your lot</h3>
            <p className="mb-0 text-sm opacity-75">
              You can follow the bids, but you cannot bid on your own auction.
            </p>
          </div>
        ) : user.role !== 'buyer' ? (
          <div className="flex flex-col gap-2">
            <h3 className="text-2xl">Read-only</h3>
            <p className="mb-0 text-sm opacity-75">
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
