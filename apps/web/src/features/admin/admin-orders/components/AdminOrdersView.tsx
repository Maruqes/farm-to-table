import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageState } from '@/components/PageState'
import { useAdminOrders } from '../useAdminOrders'
import { OrderFilters } from './OrderFilters'
import { OrdersPagination } from './OrdersPagination'
import { OrdersTable } from './OrdersTable'

export function AdminOrdersView() {
  const {
    orders,
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
  } = useAdminOrders()

  const filteredSummary = hasFilters
    ? total === 1
      ? ' matches your filter'
      : ' match your filter'
    : ''

  return (
    <section aria-labelledby="admin-orders-heading" className="flex flex-col gap-6">
      <Link to="/admin" className="inline-flex items-center gap-1 text-sm text-dim no-underline hover:text-ink hover:underline">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to admin overview
      </Link>

      <header>
        <h1 id="admin-orders-heading">Orders</h1>
        <p className="measure text-dim mb-0">
          Every order placed on Farm to Table. Filter by state to follow orders
          from pending to delivered. This list is read-only; only the producer
          who fulfils an order can change its state.
        </p>
      </header>

      <OrderFilters
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
            ? 'No orders match this state. Try another state or clear the filter.'
            : 'No orders yet. Orders appear here as soon as a buyer checks out.'
        }
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-dim mb-0">
            <data
              value={total}
              className="font-semibold tabular"
            >
              {total}
            </data>{' '}
            {total === 1 ? 'order' : 'orders'}
            {filteredSummary}
          </p>

          <OrdersTable orders={orders} />
        </div>
      </PageState>

      {total > 0 && !error && (
        <OrdersPagination
          page={page}
          pageCount={pageCount}
          onChange={setPage}
        />
      )}
    </section>
  )
}
