import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ADMIN_AUCTIONS_STATUS_FILTER_OPTIONS } from '../admin-auctions.labels'
import type {
  AdminAuctionsFilters,
  AdminAuctionsStatusFilter,
} from '../admin-auctions.types'

interface AuctionFiltersProps {
  initial: AdminAuctionsFilters
  hasActiveFilters: boolean
  onApply: (filters: AdminAuctionsFilters) => void
  onClear: () => void
}

export function AuctionFilters({
  initial,
  hasActiveFilters,
  onApply,
  onClear,
}: AuctionFiltersProps) {
  const [draft, setDraft] = useState<AdminAuctionsFilters>(initial)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply(draft)
  }

  function handleClear() {
    setDraft({ status: '' })
    onClear()
  }

  const canClear = hasActiveFilters || draft.status !== ''

  return (
    <form
      role="search"
      aria-label="Filter auctions by status"
      onSubmit={handleSubmit}
    >
      <div className="grid items-end gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="admin-auctions-status" className="form-label">
            Status
          </label>
          <select
            id="admin-auctions-status"
            name="status"
            className="form-select"
            value={draft.status}
            onChange={(event) =>
              setDraft({
                status: event.target.value as AdminAuctionsStatusFilter,
              })
            }
          >
            {ADMIN_AUCTIONS_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 md:justify-end [&>*]:flex-1 md:[&>*]:flex-none">
          <Button type="submit">Apply</Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={!canClear}
          >
            Clear
          </Button>
        </div>
      </div>
    </form>
  )
}
