import { Link } from 'react-router-dom'
import { CategoryIcon } from './CategoryIcon'
import { formatMoney } from '@/services/format'
import type { LiveAuction } from '../catalog.types'
import { useNow } from '../useNow'
import { useLiveAuctions } from '../useLiveAuctions'

function remainingLabel(endsAt: string, now: number): string {
  const end = new Date(endsAt).getTime()
  if (Number.isNaN(end)) return 'Ending soon'
  const remaining = Math.max(0, end - now)
  if (remaining === 0) return 'Ending now'
  const totalSeconds = Math.ceil(remaining / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    return `${hours}h ${minutes % 60}m left`
  }
  return `${minutes}m ${String(seconds).padStart(2, '0')}s left`
}

function AuctionChip({ auction, now, hidden }: { auction: LiveAuction; now: number; hidden?: boolean }) {
  return (
    <li className="shrink-0" aria-hidden={hidden || undefined}>
      <Link
        to={`/auctions/${auction.id}`}
        tabIndex={hidden ? -1 : undefined}
        className="flex items-center gap-2 rounded-full border bg-card py-1 pr-3 pl-1 text-sm transition-colors hover:border-live"
      >
        <span className="grid size-6 place-items-center rounded-full bg-live text-live-foreground">
          <CategoryIcon category={auction.category} className="size-3.5 text-current" />
        </span>
        <span className="max-w-40 truncate font-medium">{auction.productName}</span>
        <data value={auction.currentPrice} className="tabular font-semibold">
          {formatMoney(auction.currentPrice)}
        </data>
        <time dateTime={auction.endsAt} className="tabular text-xs text-muted-foreground">
          {remainingLabel(auction.endsAt, now)}
        </time>
      </Link>
    </li>
  )
}

// Fixed ticker at the bottom of every page (mounted by AppShell).
export function LiveAuctionsBar() {
  const auctions = useLiveAuctions(10)
  const now = useNow()

  if (auctions.length === 0) return null

  // Repeat short lists so one copy is wider than the screen; the loop scrolls exactly one copy.
  const copy = Array.from({ length: Math.ceil(8 / auctions.length) }, () => auctions).flat()

  return (
    <section
      aria-label="Live auctions"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t bg-background py-1.5"
    >
      <div className="marquee min-w-0 flex-1 overflow-hidden">
        <ul className="marquee-track flex w-max list-none gap-2 p-0">
          {copy.map((auction, i) => (
            <AuctionChip key={`a${i}`} auction={auction} now={now} hidden={i >= auctions.length} />
          ))}
          {copy.map((auction, i) => (
            <AuctionChip key={`b${i}`} auction={auction} now={now} hidden />
          ))}
        </ul>
      </div>
    </section>
  )
}
