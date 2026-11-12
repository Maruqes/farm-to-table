import { Link } from 'react-router-dom'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { useProducerDashboard } from '../useProducerDashboard'
import { DashboardCounters } from './DashboardCounters'
import { LiveAuctionCard } from './LiveAuctionCard'
import { LowStockList } from './LowStockList'
import { OrdersByStateChart } from './OrdersByStateChart'
import { SalesOverTimeChart } from './SalesOverTimeChart'

export function ProducerDashboardView() {
  const { stats, loading, error, empty, announcement, reload } = useProducerDashboard()
  const showEmpty = !loading && !error && empty

  return (
    <section aria-labelledby="producer-dashboard-heading" className="vstack gap-4">
      <header className="vstack gap-1">
        <h1 id="producer-dashboard-heading">Dashboard</h1>
        <p className="measure text-body-secondary">
          Your farm at a glance: sales, orders to prepare and what needs restocking.
        </p>
      </header>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
        empty={showEmpty}
        emptyMessage="No sales or orders yet. Add your first product to the catalog and your numbers will appear here."
      >
        {stats && (
          <div className="vstack gap-4">
            {stats.activeAuction && <LiveAuctionCard auction={stats.activeAuction} />}

            <DashboardCounters stats={stats} />

            <div className="row g-4">
              <div className="col-lg-6 min-w-0">
                <SalesOverTimeChart points={stats.salesPerDay} />
              </div>
              <div className="col-lg-6 min-w-0">
                <OrdersByStateChart byStatus={stats.byStatus} />
              </div>
            </div>

            <LowStockList items={stats.lowStock} />
          </div>
        )}
      </PageState>

      {showEmpty && (
        <div className="d-flex justify-content-center">
          <Button asChild>
            <Link to="/producer/products">Add your first product</Link>
          </Button>
        </div>
      )}
    </section>
  )
}
