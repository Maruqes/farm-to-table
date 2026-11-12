import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ADMIN_USERS_ROLE_FILTER_OPTIONS } from '../admin-users.labels'
import type {
  AdminUsersFilters,
  AdminUsersRoleFilter,
} from '../admin-users.types'

interface UserFiltersProps {
  initial: AdminUsersFilters
  hasActiveFilters: boolean
  onApply: (filters: AdminUsersFilters) => void
  onClear: () => void
}

export function UserFilters({
  initial,
  hasActiveFilters,
  onApply,
  onClear,
}: UserFiltersProps) {
  const [draft, setDraft] = useState<AdminUsersFilters>(initial)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply(draft)
  }

  function handleClear() {
    setDraft({ q: '', role: '' })
    onClear()
  }

  const canClear =
    hasActiveFilters || draft.q.trim() !== '' || draft.role !== ''

  return (
    <form
      role="search"
      aria-label="Search and filter users"
      onSubmit={handleSubmit}
    >
      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-6">
          <label htmlFor="admin-users-q" className="form-label">
            Search users
          </label>
          <Input
            id="admin-users-q"
            name="q"
            type="search"
            value={draft.q}
            onChange={(event) =>
              setDraft((current) => ({ ...current, q: event.target.value }))
            }
            placeholder="Name or email"
            autoComplete="off"
          />
        </div>

        <div className="col-12 col-md-3">
          <label htmlFor="admin-users-role" className="form-label">
            Role
          </label>
          <select
            id="admin-users-role"
            name="role"
            className="form-select"
            value={draft.role}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                role: event.target.value as AdminUsersRoleFilter,
              }))
            }
          >
            {ADMIN_USERS_ROLE_FILTER_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-3 admin-filter-actions">
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
