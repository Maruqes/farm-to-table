import { useRef, type KeyboardEvent } from 'react'
import { AUCTION_LIST_STATUS_LABELS } from '../auctions-list.labels'
import {
  AUCTION_LIST_STATUSES,
  type AuctionListStatus,
} from '../auctions-list.types'

interface AuctionListTabsProps {
  value: AuctionListStatus
  onChange: (status: AuctionListStatus) => void
}

export function AuctionListTabs({ value, onChange }: AuctionListTabsProps) {
  const tabRefs = useRef<Partial<Record<AuctionListStatus, HTMLButtonElement | null>>>({})

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const last = AUCTION_LIST_STATUSES.length - 1
    let next = index

    if (event.key === 'ArrowRight') next = index === last ? 0 : index + 1
    else if (event.key === 'ArrowLeft') next = index === 0 ? last : index - 1
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = last
    else return

    event.preventDefault()
    const nextStatus = AUCTION_LIST_STATUSES[next]
    onChange(nextStatus)
    tabRefs.current[nextStatus]?.focus()
  }

  return (
    <div role="tablist" aria-label="Auction status" className="flex flex-wrap gap-2">
      {AUCTION_LIST_STATUSES.map((status, index) => {
        const selected = status === value
        return (
          <button
            key={status}
            ref={(element) => {
              tabRefs.current[status] = element
            }}
            type="button"
            role="tab"
            id={`auctions-tab-${status}`}
            aria-selected={selected}
            aria-controls={selected ? `auctions-panel-${status}` : undefined}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(status)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={selected ? 'btn ink-fill' : 'btn btn-outline-primary'}
          >
            {AUCTION_LIST_STATUS_LABELS[status]}
          </button>
        )
      })}
    </div>
  )
}
