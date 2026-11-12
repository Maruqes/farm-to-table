import { PageState } from '@/components/PageState'
import { useAdminOverview } from '../useAdminOverview'
import { AdminCounters } from './AdminCounters'
import { AdminShortcuts } from './AdminShortcuts'
import { OrdersByStateChart } from './OrdersByStateChart'
import { SalesOverTimeChart } from './SalesOverTimeChart'

export function AdminOverviewView() {
  const { summary, loading, error, empty, reload } = useAdminOverview()
  const showEmpty = !loading && !error && empty

  return (
    <section aria-labelledby="admin-overview-heading" className="vstack gap-4">
      <header>
        <h1 id="admin-overview-heading">Admin overview</h1>
        <p className="measure text-body-secondary mb-0">
          The whole marketplace at a glance: people, orders and auctions, plus the queues
          that need a decision.
        </p>
      </header>

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
        empty={showEmpty}
        emptyMessage="No activity yet. Users, orders and auctions will appear here as the marketplace starts moving."
      >
        {summary && (
          <div className="vstack gap-4">
            <AdminCounters summary={summary} />

            <AdminShortcuts
              pendingProducers={summary.pendingProducers}
              activeAuctions={summary.activeAuctions}
            />

            <div className="row g-4">
              <div className="col-lg-6">
                <SalesOverTimeChart points={summary.salesPerDay} />
              </div>
              <div className="col-lg-6">
                <OrdersByStateChart byStatus={summary.byStatus} />
              </div>
            </div>
          </div>
        )}
      </PageState>
    </section>
  )
}
