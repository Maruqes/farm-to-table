import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageState } from '@/components/PageState'
import { useAdminUsers } from '../useAdminUsers'
import { UserFilters } from './UserFilters'
import { UsersPagination } from './UsersPagination'
import { UsersTable } from './UsersTable'

export function AdminUsersView() {
  const {
    users,
    total,
    page,
    pageCount,
    filters,
    hasFilters,
    loading,
    error,
    empty,
    announcement,
    setPage,
    reload,
    applyFilters,
    clearFilters,
  } = useAdminUsers()

  const filteredSummary = hasFilters
    ? total === 1
      ? ' matches your filters'
      : ' match your filters'
    : ''

  return (
    <section aria-labelledby="admin-users-heading" className="vstack gap-4">
      <Link to="/admin" className="admin-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to admin overview
      </Link>

      <header>
        <h1 id="admin-users-heading">Users</h1>
        <p className="measure text-body-secondary mb-0">
          Everyone registered on Farm to Table. Search by name or email, filter
          by role and check each account&apos;s state. This list is read-only.
        </p>
      </header>

      <UserFilters
        initial={filters}
        hasActiveFilters={hasFilters}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
        empty={empty}
        emptyMessage={
          hasFilters
            ? 'No users match these filters. Try a different name, email or role, or clear the filters.'
            : 'No users yet. Buyers, producers and admins appear here once they register.'
        }
      >
        <div className="vstack gap-3">
          <p className="small text-body-secondary mb-0">
            <data
              value={total}
              className="fw-semibold tabular"
            >
              {total}
            </data>{' '}
            {total === 1 ? 'user' : 'users'}
            {filteredSummary}
          </p>

          <UsersTable users={users} />
        </div>
      </PageState>

      {total > 0 && !error && (
        <UsersPagination
          page={page}
          pageCount={pageCount}
          onChange={setPage}
        />
      )}
    </section>
  )
}
