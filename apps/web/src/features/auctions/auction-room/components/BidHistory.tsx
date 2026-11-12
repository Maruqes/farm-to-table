import { Badge } from '@/components/ui/badge'
import { formatDateTime, formatMoney } from '@/services/format'
import type { AuctionRoom } from '../auction-room.types'

function emptyMessage(auction: AuctionRoom): string {
  if (auction.status === 'scheduled') return 'Bids will appear here when the auction starts.'
  if (auction.status === 'ended') return 'There were no bids for this lot.'
  return 'No bids yet. Be the first to bid.'
}

interface BidHistoryProps {
  auction: AuctionRoom
  currentUserId: string
}

export function BidHistory({ auction, currentUserId }: BidHistoryProps) {
  return (
    <section aria-labelledby="bid-history-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="bid-history-heading" className="text-2xl">
          Bid history
        </h2>
        <p className="mb-0 text-sm tabular opacity-75">
          {auction.bids.length} {auction.bids.length === 1 ? 'bid' : 'bids'}
        </p>
      </div>

      {auction.bids.length === 0 ? (
        <p className="border-2 border-dashed border-dim px-4 py-6 text-center text-sm">
          {emptyMessage(auction)}
        </p>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label="Bid history, newest first"
          className="max-h-96 overflow-y-auto border-y border-ink"
        >
          <ol className="m-0 list-none p-0">
            {auction.bids.map((bid, index) => {
              const leading = index === 0 && auction.status === 'active'
              const winning =
                index === 0 &&
                auction.status === 'ended' &&
                auction.winner !== null &&
                auction.winner.id === bid.bidderId

              return (
                <li
                  key={bid.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ink py-3 [&:last-child]:border-b-0"
                >
                  <div className="flex min-w-0 flex-wrap items-baseline gap-2">
                    <data
                      value={bid.amount}
                      className="font-display text-lg leading-[1.2] normal-case tabular"
                    >
                      {formatMoney(bid.amount)}
                    </data>
                    {leading && (
                      <Badge variant="outline">
                        Leading
                      </Badge>
                    )}
                    {winning && (
                      <Badge variant="outline">
                        Winning bid
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-baseline gap-2 text-sm">
                    <span className="font-semibold">
                      {bid.bidderName}
                      {bid.bidderId === currentUserId && (
                        <span className="opacity-75"> (you)</span>
                      )}
                    </span>
                    {bid.date && (
                      <time dateTime={bid.date} className="opacity-75">
                        {formatDateTime(bid.date)}
                      </time>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </section>
  )
}
