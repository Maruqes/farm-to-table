import type { ReactNode } from 'react'
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

function Ring({
  label,
  children,
  footnote,
}: {
  label: string
  children: ReactNode
  footnote?: ReactNode
}) {
  return (
    <div className="room-ring">
      <div className="room-ring-box">
        <svg
          viewBox="0 0 120 120"
          aria-hidden="true"
          className="room-ring-svg"
        >
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="8"
            className="room-ring-track"
          />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            strokeWidth="8"
            className="room-ring-value"
          />
        </svg>
        <div className="room-ring-inner">
          <p className="label-line mb-1">
            {label}
          </p>
          <div className="room-ring-text tabular">
            {children}
          </div>
        </div>
      </div>
      {footnote}
    </div>
  )
}

function AbsoluteTime({ value }: { value: string }) {
  return (
    <p className="small opacity-75 mb-0">
      <time dateTime={value}>{formatDateTime(value)}</time>
    </p>
  )
}

export function Countdown({ auction, now }: { auction: AuctionRoom; now: number }) {
  if (auction.status === 'ended') {
    return (
      <Ring
        label="Ended"
        footnote={
          auction.endsAt ? <AbsoluteTime value={auction.endsAt} /> : undefined
        }
      >
        <span>Closed</span>
      </Ring>
    )
  }

  if (auction.status === 'scheduled') {
    const starts = auction.startsAt ? Date.parse(auction.startsAt) : Number.NaN

    return (
      <Ring
        label="Starts in"
        footnote={
          auction.startsAt ? <AbsoluteTime value={auction.startsAt} /> : undefined
        }
      >
        {Number.isNaN(starts) ? (
          <span>Soon</span>
        ) : starts <= now ? (
          <span>Starting soon</span>
        ) : (
          <time dateTime={auction.startsAt ?? undefined} className="tabular">
            {formatCountdown(starts - now)}
          </time>
        )}
      </Ring>
    )
  }

  const ends = auction.endsAt ? Date.parse(auction.endsAt) : Number.NaN
  if (Number.isNaN(ends)) {
    return (
      <Ring label="Ends">
        <span>Soon</span>
      </Ring>
    )
  }

  const remaining = ends - now

  return (
    <Ring
      label={remaining <= 0 ? 'Time is up' : 'Ends in'}
      footnote={auction.endsAt ? <AbsoluteTime value={auction.endsAt} /> : undefined}
    >
      <time dateTime={auction.endsAt ?? undefined} className="tabular">
        {remaining <= 0 ? '00:00' : formatCountdown(remaining)}
      </time>
    </Ring>
  )
}
