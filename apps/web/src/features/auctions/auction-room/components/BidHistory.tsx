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
    <section aria-labelledby="bid-history-heading" className="vstack gap-3">
      <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
        <h2 id="bid-history-heading" className="fs-4">
          Bid history
        </h2>
        <p className="small tabular opacity-75 mb-0">
          {auction.bids.length} {auction.bids.length === 1 ? 'bid' : 'bids'}
        </p>
      </div>

      {auction.bids.length === 0 ? (
        <p className="room-empty">
          {emptyMessage(auction)}
        </p>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-label="Bid history, newest first"
          className="room-history"
        >
          <ol className="room-history-list">
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
                  className="room-history-row"
                >
                  <div className="d-flex flex-wrap align-items-baseline gap-2 min-w-0">
                    <data
                      value={bid.amount}
                      className="room-bid-amount tabular"
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
                  <div className="d-flex flex-wrap align-items-baseline gap-2 small">
                    <span className="fw-semibold">
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
