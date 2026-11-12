import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ADMIN_ORDERS_STATUS_FILTER_OPTIONS } from '../admin-orders.labels'
import type {
  AdminOrdersFilters,
  AdminOrdersStatusFilter,
} from '../admin-orders.types'

interface OrderFiltersProps {
  initial: AdminOrdersFilters
  hasActiveFilters: boolean
  onApply: (filters: AdminOrdersFilters) => void
  onClear: () => void
}

export function OrderFilters({
  initial,
  hasActiveFilters,
  onApply,
  onClear,
}: OrderFiltersProps) {
  const [draft, setDraft] = useState<AdminOrdersFilters>(initial)

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
      aria-label="Filter orders by status"
      onSubmit={handleSubmit}
    >
      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-6">
          <label htmlFor="admin-orders-status" className="form-label">
            Status
          </label>
          <select
            id="admin-orders-status"
            name="status"
            className="form-select"
            value={draft.status}
            onChange={(event) =>
              setDraft({
                status: event.target.value as AdminOrdersStatusFilter,
              })
            }
          >
            {ADMIN_ORDERS_STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-6 admin-filter-actions">
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
