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
    <section aria-labelledby="orders-by-state-heading" className="vstack gap-3">
      <div className="vstack gap-1">
        <h2 id="orders-by-state-heading">Orders by state</h2>
        <p className="small text-body-secondary">
          Where your orders are in the pickup or delivery process.
        </p>
      </div>

      <div className="rule pt-4">
      {total > 0 ? (
        <ul className="board">
          {DASHBOARD_ORDER_STATUSES.map((status) => {
            const count = byStatus[status]
            const share = total > 0 ? Math.round((count / total) * 100) : 0

            return (
              <li key={status} className="board-row">
                <div className="pa-status-label min-w-0 flex-grow-1 vstack gap-2">
                  <div className="d-flex align-items-baseline justify-content-between gap-3 small">
                    <span>{DASHBOARD_STATUS_LABELS[status]}</span>
                    <span className="text-body-secondary">
                      <data value={count} className="fw-semibold tabular">
                        {count}
                      </data>{' '}
                      <span className="tabular">({share}%)</span>
                    </span>
                  </div>
                  <div aria-hidden="true" className="pa-bar-track">
                    <div className="pa-bar-fill" style={{ width: `${share}%` }} />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="py-5 small text-body-secondary">
          No orders yet. New orders will appear here as they arrive.
        </p>
      )}
      </div>
    </section>
  )
}
