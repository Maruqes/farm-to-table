import { Link } from 'react-router-dom'
import { ArrowRight, Users } from 'lucide-react'
import { CategoryIcon } from '@/features/catalog/home-catalog/components/CategoryIcon'
import { formatMoney } from '@/services/format'
import type { AuctionListItem, AuctionListStatus } from '../auctions-list.types'
import { AuctionCountdown } from './AuctionCountdown'
import { AuctionListStatusBadge } from './AuctionListStatusBadge'

const TILE: Record<string, string> = {
  vegetables: 'bg-tile-veg',
  fruit: 'bg-tile-fruit',
  honey: 'bg-tile-honey',
  wine: 'bg-tile-wine',
  cheese: 'bg-tile-cheese',
  bakery: 'bg-tile-bakery',
}

const PRICE_LABEL: Record<AuctionListStatus, string> = {
  active: 'Current bid',
  scheduled: 'Starting price',
  ended: 'Final price',
}

const ROOM_LABEL: Record<AuctionListStatus, string> = {
  active: 'Open room',
  scheduled: 'See the lot',
  ended: 'View results',
}

function watcherCopy(status: AuctionListStatus, viewers: number): string {
  if (viewers === 0) {
    return status === 'ended' ? 'No watchers' : 'No watchers yet'
  }
  if (status === 'ended') return `${viewers} watched`

  const noun = viewers === 1 ? 'watcher' : 'watchers'
  return `${viewers} ${noun}`
}

export function AuctionCard({
  auction,
  now,
}: {
  auction: AuctionListItem
  now: number
}) {
  return (
    <li className="h-full">
      <Link
        to={`/auctions/${auction.id}`}
        className="group flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:border-foreground/30 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              aria-hidden="true"
              className={`grid size-12 shrink-0 place-items-center rounded-xl border ${
                TILE[auction.category] ?? 'bg-tile-veg'
              }`}
            >
              <CategoryIcon category={auction.category} className="size-6" />
            </div>
            <h2 className="min-w-0 break-words text-lg leading-snug group-hover:text-primary">
              {auction.productName}
            </h2>
          </div>
          <AuctionListStatusBadge status={auction.status} />
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">{PRICE_LABEL[auction.status]}</p>
            <data
              value={auction.currentPrice}
              className="font-display text-2xl font-extrabold tabular"
            >
              {formatMoney(auction.currentPrice)}
            </data>
          </div>
          <AuctionCountdown auction={auction} now={now} />
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="size-4" aria-hidden="true" />
            <span className="tabular">{watcherCopy(auction.status, auction.viewers)}</span>
          </span>

          <span className="inline-flex items-center gap-1 font-medium text-primary">
            {ROOM_LABEL[auction.status]}
            <ArrowRight
              className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </li>
  )
}
