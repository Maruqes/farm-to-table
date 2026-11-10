import { Link } from 'react-router-dom'
import { Clock, Gavel } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/services/format'
import type { LiveAuction } from '../catalog.types'
import { useNow } from '../useNow'

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

export function LiveAuctionsStrip({ auctions }: { auctions: LiveAuction[] }) {
  const now = useNow()

  if (auctions.length === 0) return null

  return (
    <section aria-labelledby="live-auctions-title">
      <div className="flex items-center gap-2">
        <Gavel className="size-5 text-live" aria-hidden="true" />
        <h2 id="live-auctions-title" className="text-2xl font-semibold md:text-3xl">
          Live auctions
        </h2>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Bidding is open now — join before the clock runs out.</p>

      <ul className="mt-4 grid list-none gap-3 p-0 md:grid-cols-2 lg:grid-cols-3">
        {auctions.map((auction) => (
          <li key={auction.id}>
            <Link
              to={`/auctions/${auction.id}`}
              className="flex h-full flex-col gap-2 rounded-xl border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge className="bg-live text-live-foreground">Live</Badge>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" aria-hidden="true" />
                  <time dateTime={auction.endsAt}>{remainingLabel(auction.endsAt, now)}</time>
                </span>
              </div>
              <p className="font-medium leading-snug">{auction.productName}</p>
              <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
                <span className="text-sm text-muted-foreground">Current bid</span>
                <data value={auction.currentPrice} className="tabular font-semibold">
                  {formatMoney(auction.currentPrice)}
                </data>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
