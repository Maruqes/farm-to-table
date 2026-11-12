import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CrateChip } from '@/components/board'
import { lotNumber } from '@/components/crate'
import { formatMoney } from '@/services/format'
import type { AuctionListItem, AuctionListStatus } from '../auctions-list.types'
import { AuctionCountdown } from './AuctionCountdown'
import { AuctionListStatusBadge } from './AuctionListStatusBadge'

const PRICE_LABEL: Record<AuctionListStatus, string> = {
  active: 'Current bid',
  scheduled: 'Starting price',
  ended: 'Final price',
}

function roomLabel(status: AuctionListStatus): string {
  return status === 'active' ? 'Enter' : 'View'
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
  const action = roomLabel(auction.status)
  const isLive = auction.status === 'active'

  return (
    <li className="board-row flex-wrap">
      <CrateChip category={auction.category} />
      <span className="lot tabular">lot {lotNumber(auction.id)}</span>

      <div className="min-w-40 flex-auto">
        <h2>
          <Link
            to={`/auctions/${auction.id}`}
            className="underline"
          >
            {auction.productName}
          </Link>
        </h2>
        <p className="truncate text-sm tabular text-dim">
          {watcherCopy(auction.status, auction.viewers)}
        </p>
      </div>

      <div className="hidden md:block">
        <AuctionListStatusBadge status={auction.status} />
      </div>

      <AuctionCountdown auction={auction} now={now} />

      <div className="text-right">
        <p className="mb-0 text-sm text-dim">{PRICE_LABEL[auction.status]}</p>
        <data
          value={auction.currentPrice}
          className={isLive ? 'price-tag' : 'price'}
        >
          {formatMoney(auction.currentPrice)}
        </data>
      </div>

      <Button asChild>
        <Link
          to={`/auctions/${auction.id}`}
          aria-label={`${action} auction for ${auction.productName}`}
        >
          {action}
        </Link>
      </Button>
    </li>
  )
}
