import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ADMIN_USERS_ROLE_FILTER_OPTIONS } from '../admin-users.labels'
import type {
  AdminUsersFilters,
  AdminUsersRoleFilter,
} from '../admin-users.types'

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

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
      className="rounded-xl border bg-card p-3"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(11rem,1fr)_auto] md:items-end">
        <div>
          <label
            htmlFor="admin-users-q"
            className="mb-1 block text-sm font-medium"
          >
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
            className="h-10"
          />
        </div>

        <div>
          <label
            htmlFor="admin-users-role"
            className="mb-1 block text-sm font-medium"
          >
            Role
          </label>
          <select
            id="admin-users-role"
            name="role"
            className={selectClassName}
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

        <div className="flex gap-2 md:justify-end">
          <Button type="submit" className="h-10 flex-1 md:flex-none">
            Apply
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 md:flex-none"
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
