import { formatDateTime } from '@/services/format'
import type { AuctionListItem } from '../auctions-list.types'

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const pad = (value: number) => String(value).padStart(2, '0')

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`
}

export function AuctionCountdown({
  auction,
  now,
}: {
  auction: AuctionListItem
  now: number
}) {
  if (auction.status === 'ended') {
    return (
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Closed</p>
        <p className="text-sm font-medium">
          {auction.endsAt ? (
            <time dateTime={auction.endsAt} className="tabular">
              {formatDateTime(auction.endsAt)}
            </time>
          ) : (
            '—'
          )}
        </p>
      </div>
    )
  }

  const ends = auction.endsAt ? Date.parse(auction.endsAt) : Number.NaN

  if (Number.isNaN(ends)) {
    return (
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Ends in</p>
        <p className="font-display text-2xl font-extrabold">Soon</p>
      </div>
    )
  }

  const remaining = ends - now

  return (
    <div className="text-right">
      <p className="text-xs text-muted-foreground">
        {remaining <= 0 ? 'Time is up' : 'Ends in'}
      </p>
      <time
        dateTime={auction.endsAt ?? undefined}
        className="block font-display text-2xl font-extrabold tabular"
      >
        {remaining <= 0 ? '00:00' : formatCountdown(remaining)}
      </time>
    </div>
  )
}
