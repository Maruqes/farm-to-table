import type { DashboardOrderStatus } from '../producer-dashboard.types'
import {
  DASHBOARD_ORDER_STATUSES,
  DASHBOARD_STATUS_LABELS,
} from '../producer-dashboard.labels'

interface OrdersByStateChartProps {
  byStatus: Record<DashboardOrderStatus, number>
}

export function OrdersByStateChart({ byStatus }: OrdersByStateChartProps) {
  const total = DASHBOARD_ORDER_STATUSES.reduce(
    (sum, status) => sum + byStatus[status],
    0,
  )

  return (
    <section aria-labelledby="orders-by-state-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="orders-by-state-heading">Orders by state</h2>
        <p className="text-sm text-dim">
          Where your orders are in the pickup or delivery process.
        </p>
      </div>

      <div className="rule pt-6">
      {total > 0 ? (
        <ul className="board">
          {DASHBOARD_ORDER_STATUSES.map((status) => {
            const count = byStatus[status]
            const share = total > 0 ? Math.round((count / total) * 100) : 0

            return (
              <li key={status} className="board-row">
                <div className="flex min-w-28 grow flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-4 text-sm">
                    <span>{DASHBOARD_STATUS_LABELS[status]}</span>
                    <span className="text-dim">
                      <data value={count} className="font-semibold tabular">
                        {count}
                      </data>{' '}
                      <span className="tabular">({share}%)</span>
                    </span>
                  </div>
                  <div aria-hidden="true" className="h-2 bg-wash">
                    <div className="h-full bg-ink" style={{ width: `${share}%` }} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
          <p className="py-12 text-sm text-dim">
          No orders yet. New orders will appear here as they arrive.
        </p>
      )}
      </div>
    </section>
  )
}
