import { useId } from 'react'
import type { AdminOrderStatus } from '../admin-overview.types'
import {
  ADMIN_ORDER_STATUSES,
  ADMIN_ORDER_STATUS_LABELS,
} from '../admin-overview.labels'

interface OrdersByStateChartProps {
  byStatus: Record<AdminOrderStatus, number>
}

export function OrdersByStateChart({ byStatus }: OrdersByStateChartProps) {
  const headingId = useId()
  const total = ADMIN_ORDER_STATUSES.reduce((sum, status) => sum + byStatus[status], 0)

  return (
    <section aria-labelledby={headingId} className="admin-chart">
      <div>
        <h2 id={headingId}>Orders by state</h2>
        <p className="small text-body-secondary mb-0">
          Every order on the marketplace, by where it is in the process.
        </p>
      </div>

      {total > 0 ? (
        <ul className="board mt-4">
          {ADMIN_ORDER_STATUSES.map((status) => {
            const count = byStatus[status]
            const share = total > 0 ? Math.round((count / total) * 100) : 0

            return (
              <li key={status} className="py-3 border-bottom">
                <div className="d-flex align-items-baseline justify-content-between gap-3 small">
                  <span>{ADMIN_ORDER_STATUS_LABELS[status]}</span>
                  <span className="text-body-secondary">
                    <data value={count} className="fw-semibold tabular">
                      {count}
                    </data>{' '}
                    <span className="tabular">({share}%)</span>
                  </span>
                </div>
                <div aria-hidden="true" className="admin-chart-track mt-2">
                  <div
                    className="admin-chart-fill"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="small text-body-secondary py-5 mb-0">
          No orders yet. New orders will appear here as buyers check out.
        </p>
      )}
    </section>
  )
}
