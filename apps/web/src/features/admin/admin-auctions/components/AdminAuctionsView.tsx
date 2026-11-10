import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageState } from '@/components/PageState'
import { useAdminAuctions } from '../useAdminAuctions'
import { AuctionFilters } from './AuctionFilters'
import { AuctionsPagination } from './AuctionsPagination'
import { AuctionsTable } from './AuctionsTable'

export function AdminAuctionsView() {
  const {
    auctions,
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
  } = useAdminAuctions()

  const filteredSummary = hasFilters
    ? total === 1
      ? ' matches your filter'
      : ' match your filter'
    : ''

  return (
    <section aria-labelledby="admin-auctions-heading" className="space-y-6">
      <Link
        to="/admin"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to admin overview
      </Link>

      <header className="space-y-1">
        <h1 id="admin-auctions-heading">Auctions</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Live and recent auctions across Farm to Table. Filter by state to
          follow a sale from scheduled to ended. This list is read-only; open a
          room to watch bidding.
        </p>
      </header>

      <AuctionFilters
        initial={filters}
        hasActiveFilters={hasFilters}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <p className="sr-only" aria-live="polite">
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
            ? 'No auctions match this state. Try another state or clear the filter.'
            : 'No auctions yet. Auctions appear here once a producer publishes one.'
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            <data
              value={total}
              className="font-medium text-foreground tabular"
            >
              {total}
            </data>{' '}
            {total === 1 ? 'auction' : 'auctions'}
            {filteredSummary}
          </p>

          <AuctionsTable auctions={auctions} />
        </div>
      </PageState>

      {total > 0 && !error && (
        <AuctionsPagination
          page={page}
          pageCount={pageCount}
          onChange={setPage}
        />
      )}
    </section>
  )
}
