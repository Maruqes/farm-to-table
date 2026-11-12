import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Pencil, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CrateChip } from '@/components/board'
import { lotNumber } from '@/components/crate'
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
    <li className="board-row pa-auction-row">
      <div className="d-flex min-w-0 align-items-center gap-3">
        <CrateChip category={auction.product.category} />
        <span aria-hidden="true" className="lot">
          {lotNumber(auction.id)}
        </span>

        <div className="min-w-0 vstack gap-1">
          <p className="text-break fw-semibold">{auction.product.name}</p>
          <p className="small text-body-secondary">
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
            <p className="text-break small text-body-secondary">
              Leading: <span className="fw-semibold">{auction.leader.name}</span>
            </p>
          )}
          {auction.status === 'ended' && !hasBids && (
            <p className="small text-body-secondary">Ended with no bids.</p>
          )}
        </div>
      </div>

      <div className="d-flex align-items-baseline justify-content-between gap-2 pa-md-block">
        <span className="label-line pa-col-label">Price</span>
        <div className="vstack gap-1 text-md-end">
          <p className="text-nowrap small">
            <span className="text-body-secondary">Base </span>
            <data value={auction.basePrice} className="fw-semibold tabular">
              {formatMoney(auction.basePrice)}
            </data>
          </p>
          {hasBids && (
            <p className="text-nowrap small">
              <span className="text-body-secondary">Current </span>
              <data
                value={auction.currentPrice}
                className="font-display tabular"
              >
                {formatMoney(auction.currentPrice)}
              </data>
            </p>
          )}
          <p className="text-nowrap pa-xs text-body-secondary">
            {hasBids ? `${auction.bidCount} bids` : 'No bids yet'}
          </p>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between gap-2 pa-md-block">
        <span className="label-line pa-col-label">Status</span>
        <AuctionStatusBadge status={auction.status} />
      </div>

      <div className="vstack gap-2">
        {hasBids && auction.status !== 'ended' && (
          <p className="pa-xs text-body-secondary">
            Bids are in, so cancellation is closed.
          </p>
        )}

        <div className="pa-actions">
          {canEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onEdit(auction)}
              disabled={busy}
              aria-label={`Edit draft auction for ${auction.product.name}`}
            >
              <Pencil size={16} aria-hidden="true" />
              Edit
            </Button>
          )}

          {canEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => void handlePublish()}
              disabled={busy || publishing}
              aria-label={`Publish auction for ${auction.product.name}`}
            >
              <Send size={16} aria-hidden="true" />
              {publishing ? 'Publishing…' : 'Publish'}
            </Button>
          )}

          {auction.status !== 'draft' && (
            <Button asChild variant="outline" size="sm">
              <Link
                to={`/auctions/${encodeURIComponent(auction.id)}`}
                aria-label={`${roomLabel} for ${auction.product.name}`}
              >
                <ArrowUpRight size={16} aria-hidden="true" />
                {roomLabel}
              </Link>
            </Button>
          )}

          {canCancel && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-danger"
              onClick={() => {
                setCancelError(null)
                setConfirming(true)
              }}
              disabled={busy || confirming}
              aria-label={`Cancel auction for ${auction.product.name}`}
            >
              <X size={16} aria-hidden="true" />
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
          className="frame-alarm p-3 pa-confirm-span"
        >
          <p id={`cancel-title-${auction.id}`} className="fw-semibold">
            Cancel the auction for {auction.product.name}?
          </p>
          <p
            id={`cancel-desc-${auction.id}`}
            className="mt-1 small text-body-secondary"
          >
            No bids have arrived yet, so the lot can be cancelled. It moves to Ended
            and cannot be reopened.
          </p>

          {cancelError && (
            <p role="alert" className="mt-2 small text-danger">
              {cancelError}
            </p>
          )}

          <div className="d-flex flex-wrap gap-2 mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
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
    <div className="vstack gap-4">
      <div
        role="group"
        aria-label="Filter auctions by state"
        className="d-flex flex-wrap gap-2"
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
              className="pa-filter"
            >
              {option.label}
              <span className="pa-filter-count tabular" aria-hidden="true">
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {totalVisible === 0 ? (
        <p className="pa-empty text-center">No auctions in this state yet.</p>
      ) : (
        visible.map((status) => {
          const items = grouped[status]
          if (items.length === 0) return null
          const headingId = `auction-group-${status}`
          return (
            <section key={status} aria-labelledby={headingId} className="vstack gap-3">
              <div className="d-flex flex-wrap align-items-baseline gap-2">
                <h2 id={headingId}>
                  {AUCTION_STATUS_LABELS[status]}
                  <span className="ms-2 small text-body-secondary tabular">
                    {items.length}
                  </span>
                </h2>
                <p className="small text-body-secondary">
                  {AUCTION_STATUS_DESCRIPTIONS[status]}
                </p>
              </div>

              <div>
                <div
                  aria-hidden="true"
                  className="label-line d-none d-md-grid pa-auction-head py-2"
                >
                  <span>Lot</span>
                  <span>Price</span>
                  <span>State</span>
                  <span className="text-end">Actions</span>
                </div>

                <ul aria-labelledby={headingId} className="board">
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
