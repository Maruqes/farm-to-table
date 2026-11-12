import { Link } from 'react-router-dom'
import { lotNumber } from '@/components/crate'
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

// The live strip of the painted price board (RULES.md): a 4px ink bar with one
// line of mono text (lot, item, time left) and the current bid as the single
// tilted .price-tag. It links to the auction room. A static strip (no marquee)
// so the strip holds at most one tilted tag; the rest stay one tap away.
export function LiveAuctionsBar() {
  const auctions = useLiveAuctions(10)
  const now = useNow()

  if (auctions.length === 0) return null

  const ordered = [...auctions].sort(
    (a: LiveAuction, b: LiveAuction) =>
      new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
  )
  const [first] = ordered
  if (!first) return null

  return (
    <section
      aria-label="Live auctions"
      className="catalog-live-strip fixed-bottom"
    >
      <div className="container d-flex align-items-center gap-3 py-2">
        <Link
          to={`/auctions/${first.id}`}
          className="d-flex min-w-0 flex-grow-1 align-items-center gap-3"
          aria-label={`Live auction: ${first.productName}, current bid ${formatMoney(first.currentPrice)}, ${remainingLabel(first.endsAt, now)}`}
        >
          <span aria-hidden="true" className="catalog-live-text min-w-0 flex-grow-1 small">
            Live · lot {lotNumber(first.id)} · {first.productName} ·{' '}
            <time dateTime={first.endsAt} className="tabular">
              {remainingLabel(first.endsAt, now)}
            </time>
          </span>
          <data value={first.currentPrice} className="price-tag tabular catalog-live-price" aria-hidden="true">
            {formatMoney(first.currentPrice)}
          </data>
        </Link>
        {ordered.length > 1 && (
          <Link
            to="/auctions"
            className="flex-shrink-0 small fw-semibold"
          >
            All {ordered.length} live
          </Link>
        )}
      </div>
    </section>
  )
}
