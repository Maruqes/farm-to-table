import { formatDateTime } from '@/services/format'
import type { AuctionRoom } from '../auction-room.types'

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

export function Countdown({ auction, now }: { auction: AuctionRoom; now: number }) {
  if (auction.status === 'ended') {
    return (
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Ended</p>
        <p className="font-display text-2xl font-extrabold">
          {auction.endsAt ? (
            <time dateTime={auction.endsAt}>{formatDateTime(auction.endsAt)}</time>
          ) : (
            '—'
          )}
        </p>
      </div>
    )
  }

  if (auction.status === 'scheduled') {
    const starts = auction.startsAt ? Date.parse(auction.startsAt) : Number.NaN

    return (
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Starts in</p>
        <p className="font-display text-2xl font-extrabold tabular">
          {Number.isNaN(starts)
            ? 'Soon'
            : starts <= now
              ? 'Starting soon'
              : formatCountdown(starts - now)}
        </p>
        {auction.startsAt && (
          <p className="text-xs text-muted-foreground">
            <time dateTime={auction.startsAt}>{formatDateTime(auction.startsAt)}</time>
          </p>
        )}
      </div>
    )
  }

  const ends = auction.endsAt ? Date.parse(auction.endsAt) : Number.NaN
  if (Number.isNaN(ends)) {
    return (
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Ends</p>
        <p className="font-display text-2xl font-extrabold">Soon</p>
      </div>
    )
  }

  const remaining = ends - now

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">
        {remaining <= 0 ? 'Time is up' : 'Ends in'}
      </p>
      <p className="font-display text-2xl font-extrabold tabular md:text-3xl">
        {remaining <= 0 ? '00:00' : formatCountdown(remaining)}
      </p>
      {auction.endsAt && (
        <p className="text-xs text-muted-foreground">
          <time dateTime={auction.endsAt}>{formatDateTime(auction.endsAt)}</time>
        </p>
      )}
    </div>
  )
}
