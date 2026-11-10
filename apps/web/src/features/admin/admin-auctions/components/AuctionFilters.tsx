import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ADMIN_AUCTIONS_STATUS_FILTER_OPTIONS } from '../admin-auctions.labels'
import type {
  AdminAuctionsFilters,
  AdminAuctionsStatusFilter,
} from '../admin-auctions.types'

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

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
      className="rounded-xl border bg-card p-3"
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div>
          <label
            htmlFor="admin-auctions-status"
            className="mb-1 block text-sm font-medium"
          >
            Status
          </label>
          <select
            id="admin-auctions-status"
            name="status"
            className={selectClassName}
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

        <div className="flex gap-2 sm:justify-end">
          <Button type="submit" className="h-10 flex-1 sm:flex-none">
            Apply
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 sm:flex-none"
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
