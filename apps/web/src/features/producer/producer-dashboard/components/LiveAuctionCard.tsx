import { Link } from 'react-router-dom'
import { ArrowRight, Radio } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/services/format'
import type { DashboardActiveAuction } from '../producer-dashboard.types'

interface LiveAuctionCardProps {
  auction: DashboardActiveAuction
}

export function LiveAuctionCard({ auction }: LiveAuctionCardProps) {
  return (
    <section
      aria-labelledby="live-auction-heading"
      className="frame-thick p-4 p-md-5"
    >
      <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3">
        <div className="min-w-0 vstack gap-2">
          <Badge variant="live">
            <Radio size={16} aria-hidden="true" />
            Live auction
          </Badge>
          <h2 id="live-auction-heading">Your live auction: {auction.product}</h2>
          <p className="small text-body-secondary">
            Price, bids and watchers update as buyers bid.
          </p>
        </div>
        <Button asChild className="flex-shrink-0">
          <Link to={`/auctions/${encodeURIComponent(auction.id)}`}>
            Follow live
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <dl className="board mt-4">
        <div className="board-row flex-wrap">
          <dt className="label-line min-w-0 flex-grow-1">Current price</dt>
          <dd>
            <data value={auction.currentPrice} className="price-tag tabular">
              {formatMoney(auction.currentPrice)}
            </data>
          </dd>
        </div>
        <div className="board-row flex-wrap">
          <dt className="label-line min-w-0 flex-grow-1">Bids</dt>
          <dd className="price">
            <data value={auction.bidCount} className="tabular">
              {auction.bidCount}
            </data>
          </dd>
        </div>
        <div className="board-row flex-wrap">
          <dt className="label-line min-w-0 flex-grow-1">Watching</dt>
          <dd className="price">
            <data value={auction.viewers} className="tabular">
              {auction.viewers}
            </data>
          </dd>
        </div>
      </dl>
    </section>
  )
}
