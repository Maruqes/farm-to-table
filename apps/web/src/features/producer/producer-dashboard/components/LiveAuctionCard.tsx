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
    <section aria-labelledby="live-auction-heading" className="rounded-xl border bg-card">
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="space-y-2">
          <Badge className="bg-live text-live-foreground">
            <Radio aria-hidden="true" />
            Live auction
          </Badge>
          <h2 id="live-auction-heading" className="text-xl md:text-2xl">
            Your live auction: {auction.product}
          </h2>
          <p className="text-sm text-muted-foreground">
            Price, bids and watchers update as buyers bid.
          </p>
        </div>
        <Button asChild>
          <Link to={`/auctions/${encodeURIComponent(auction.id)}`}>
            Follow live
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <dl className="grid grid-cols-3 gap-4 border-t px-4 py-4 md:px-6">
        <div>
          <dt className="text-xs text-muted-foreground">Current price</dt>
          <dd className="font-display text-lg font-extrabold tabular md:text-xl">
            <data value={auction.currentPrice}>{formatMoney(auction.currentPrice)}</data>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Bids</dt>
          <dd className="font-display text-lg font-extrabold tabular md:text-xl">
            <data value={auction.bidCount}>{auction.bidCount}</data>
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Watching</dt>
          <dd className="font-display text-lg font-extrabold tabular md:text-xl">
            <data value={auction.viewers}>{auction.viewers}</data>
          </dd>
        </div>
      </dl>
    </section>
  )
}
