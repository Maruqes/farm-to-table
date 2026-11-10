import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Pencil, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/features/catalog/home-catalog/components/CategoryIcon'
import { formatDateTime, formatMoney } from '@/services/format'
import { AuctionStatusBadge } from './AuctionStatusBadge'
import {
  AUCTION_STATUS_DESCRIPTIONS,
  AUCTION_STATUS_LABELS,
  AUCTION_STATUS_ORDER,
} from '../producer-auctions.labels'
import type {
  AuctionActionResult,
  AuctionStatus,
  ProducerAuction,
} from '../producer-auctions.types'

const TILE: Record<string, string> = {
  fruit: 'bg-tile-fruit',
  honey: 'bg-tile-honey',
  wine: 'bg-tile-wine',
  cheese: 'bg-tile-cheese',
  bakery: 'bg-tile-bakery',
}

type AuctionFilter = 'all' | AuctionStatus

const FILTER_OPTIONS: { value: AuctionFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...AUCTION_STATUS_ORDER.map((status) => ({
    value: status,
    label: AUCTION_STATUS_LABELS[status],
  })),
]

function sortFor(status: AuctionStatus, auctions: ProducerAuction[]): ProducerAuction[] {
  return [...auctions].sort((left, right) => {
    const leftTime = left.startsAt ? Date.parse(left.startsAt) : 0
    const rightTime = right.startsAt ? Date.parse(right.startsAt) : 0
    return status === 'ended' ? rightTime - leftTime : leftTime - rightTime
  })
}

interface AuctionRowProps {
  auction: ProducerAuction
  busy: boolean
  onEdit: (auction: ProducerAuction) => void
  onPublish: (id: string) => Promise<AuctionActionResult>
  onCancel: (id: string) => Promise<AuctionActionResult>
}

function AuctionRow({ auction, busy, onEdit, onPublish, onCancel }: AuctionRowProps) {
  const [confirming, setConfirming] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const hasBids = auction.bidCount > 0
  const canCancel = auction.status !== 'ended' && !hasBids
  const canEdit = auction.status === 'draft'
  const roomLabel = auction.status === 'ended' ? 'View result' : 'Open room'
  const whenLabel =
    auction.status === 'draft' || auction.status === 'scheduled' ? 'Starts' : 'Ends'
  const when = whenLabel === 'Starts' ? auction.startsAt : auction.endsAt

  async function handlePublish() {
    if (publishing) return
    setPublishing(true)
    await onPublish(auction.id)
    setPublishing(false)
  }

  async function handleCancel() {
    if (cancelling) return
    setCancelling(true)
    setCancelError(null)
    const result = await onCancel(auction.id)
    setCancelling(false)
    if (result.ok) {
      setConfirming(false)
      return
    }
    setCancelError(result.message)
  }

  return (
    <li className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_10rem_6.5rem_minmax(14rem,auto)] md:items-center md:gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`size-14 shrink-0 overflow-hidden rounded-lg ${
            TILE[auction.product.category] ?? 'bg-tile-veg'
          }`}
        >
          <div className="flex size-full items-center justify-center">
            <CategoryIcon category={auction.product.category} className="size-7" />
          </div>
        </div>

        <div className="min-w-0 space-y-1">
          <p className="break-words font-medium">{auction.product.name}</p>
          <p className="text-sm text-muted-foreground">
            <span className="tabular">
              {auction.quantity} {auction.unit}
            </span>
            <span aria-hidden="true"> · </span>
            {when ? (
              <>
                {whenLabel}{' '}
                <time dateTime={when}>{formatDateTime(when)}</time>
              </>
            ) : (
              <span>Start time not set</span>
            )}
          </p>
          {auction.leader && (
            <p className="break-words text-sm text-muted-foreground">
              Leading: <span className="font-medium text-foreground">{auction.leader.name}</span>
            </p>
          )}
          {auction.status === 'ended' && !hasBids && (
            <p className="text-sm text-muted-foreground">Ended with no bids.</p>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 md:block">
        <span className="text-sm text-muted-foreground md:sr-only">Price</span>
        <div className="space-y-0.5 text-right md:text-left">
          <p className="whitespace-nowrap text-sm">
            <span className="text-muted-foreground">Base </span>
            <data value={auction.basePrice} className="font-medium tabular">
              {formatMoney(auction.basePrice)}
            </data>
          </p>
          {hasBids && (
            <p className="whitespace-nowrap text-sm">
              <span className="text-muted-foreground">Current </span>
              <data
                value={auction.currentPrice}
                className="font-display font-extrabold tabular"
              >
                {formatMoney(auction.currentPrice)}
              </data>
            </p>
          )}
          <p className="whitespace-nowrap text-xs text-muted-foreground">
            {hasBids ? `${auction.bidCount} bids` : 'No bids yet'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 md:block">
        <span className="text-sm text-muted-foreground md:sr-only">Status</span>
        <AuctionStatusBadge status={auction.status} />
      </div>

      <div className="space-y-2">
        {hasBids && auction.status !== 'ended' && (
          <p className="text-xs text-muted-foreground">
            Bids are in, so cancellation is closed.
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:justify-end">
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 px-3"
              onClick={() => onEdit(auction)}
              disabled={busy}
              aria-label={`Edit draft auction for ${auction.product.name}`}
            >
              <Pencil className="size-4" aria-hidden="true" />
              Edit
            </Button>
          )}

          {canEdit && (
            <Button
              type="button"
              size="sm"
              className="h-10 px-3"
              onClick={() => void handlePublish()}
              disabled={busy || publishing}
              aria-label={`Publish auction for ${auction.product.name}`}
            >
              <Send className="size-4" aria-hidden="true" />
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          )}

          {auction.status !== 'draft' && (
            <Button asChild variant="outline" size="sm" className="h-10 px-3">
              <Link
                to={`/auctions/${encodeURIComponent(auction.id)}`}
                aria-label={`${roomLabel} for ${auction.product.name}`}
              >
                <ArrowUpRight className="size-4" aria-hidden="true" />
                {roomLabel}
              </Link>
            </Button>
          )}

          {canCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10 px-3 text-destructive hover:text-destructive"
              onClick={() => {
                setCancelError(null)
                setConfirming(true)
              }}
              disabled={busy || confirming}
              aria-label={`Cancel auction for ${auction.product.name}`}
            >
              <X className="size-4" aria-hidden="true" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {confirming && canCancel && (
        <div
          role="alertdialog"
          aria-labelledby={`cancel-title-${auction.id}`}
          aria-describedby={`cancel-desc-${auction.id}`}
          aria-busy={cancelling}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !cancelling) setConfirming(false)
          }}
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 md:col-span-4"
        >
          <p id={`cancel-title-${auction.id}`} className="font-medium">
            Cancel the auction for {auction.product.name}?
          </p>
          <p
            id={`cancel-desc-${auction.id}`}
            className="mt-1 text-sm text-muted-foreground"
          >
            No bids have arrived yet, so the lot can be cancelled. It moves to Ended
            and cannot be reopened.
          </p>

          {cancelError && (
            <p role="alert" className="mt-2 text-sm text-destructive">
              {cancelError}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => setConfirming(false)}
              disabled={cancelling}
              autoFocus
            >
              Keep auction
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-10"
              onClick={() => void handleCancel()}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling…' : 'Cancel auction'}
            </Button>
          </div>
        </div>
      )}
    </li>
  )
}

interface AuctionListProps {
  auctions: ProducerAuction[]
  busy: boolean
  onEdit: (auction: ProducerAuction) => void
  onPublish: (id: string) => Promise<AuctionActionResult>
  onCancel: (id: string) => Promise<AuctionActionResult>
}

export function AuctionList({
  auctions,
  busy,
  onEdit,
  onPublish,
  onCancel,
}: AuctionListProps) {
  const [filter, setFilter] = useState<AuctionFilter>('all')

  const counts = useMemo(() => {
    const map: Record<AuctionStatus, number> = {
      draft: 0,
      scheduled: 0,
      active: 0,
      ended: 0,
    }
    for (const auction of auctions) map[auction.status] += 1
    return map
  }, [auctions])

  const grouped = useMemo(() => {
    const map: Record<AuctionStatus, ProducerAuction[]> = {
      draft: [],
      scheduled: [],
      active: [],
      ended: [],
    }
    for (const auction of auctions) map[auction.status].push(auction)
    for (const status of AUCTION_STATUS_ORDER) {
      map[status] = sortFor(status, map[status])
    }
    return map
  }, [auctions])

  const visible = filter === 'all' ? AUCTION_STATUS_ORDER : [filter]
  const totalVisible = visible.reduce((sum, status) => sum + grouped[status].length, 0)

  return (
    <div className="space-y-6">
      <div
        role="group"
        aria-label="Filter auctions by state"
        className="flex flex-wrap gap-2"
      >
        {FILTER_OPTIONS.map((option) => {
          const count = option.value === 'all' ? auctions.length : counts[option.value]
          const active = filter === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              aria-label={`${option.label} (${count})`}
              onClick={() => setFilter(option.value)}
              className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {option.label}
              <span className="tabular text-xs opacity-80" aria-hidden="true">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {totalVisible === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No auctions in this state yet.
        </p>
      ) : (
        visible.map((status) => {
          const items = grouped[status]
          if (items.length === 0) return null
          const headingId = `auction-group-${status}`
          return (
            <section key={status} aria-labelledby={headingId} className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 id={headingId} className="text-xl">
                  {AUCTION_STATUS_LABELS[status]}
                  <span className="ml-2 text-sm font-medium text-muted-foreground tabular">
                    {items.length}
                  </span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  {AUCTION_STATUS_DESCRIPTIONS[status]}
                </p>
              </div>

              <div>
                <div
                  aria-hidden="true"
                  className="hidden rounded-t-xl border border-b-0 bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1fr)_10rem_6.5rem_minmax(14rem,auto)] md:gap-4"
                >
                  <span>Lot</span>
                  <span>Price</span>
                  <span>State</span>
                  <span className="text-right">Actions</span>
                </div>

                <ul
                  aria-labelledby={headingId}
                  className="divide-y rounded-xl border bg-card md:rounded-t-none"
                >
                  {items.map((auction) => (
                    <AuctionRow
                      key={auction.id}
                      auction={auction}
                      busy={busy}
                      onEdit={onEdit}
                      onPublish={onPublish}
                      onCancel={onCancel}
                    />
                  ))}
                </ul>
              </div>
            </section>
          )
        })
      )}
    </div>
  )
}
