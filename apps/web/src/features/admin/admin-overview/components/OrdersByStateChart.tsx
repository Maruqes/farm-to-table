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
    <section aria-labelledby={headingId} className="border-t-2 border-ink pt-4">
      <div>
        <h2 id={headingId}>Orders by state</h2>
        <p className="text-sm text-dim mb-0">
          Every order on the marketplace, by where it is in the process.
        </p>
      </div>

      {total > 0 ? (
        <ul className="board mt-6">
          {ADMIN_ORDER_STATUSES.map((status) => {
            const count = byStatus[status]
            const share = total > 0 ? Math.round((count / total) * 100) : 0

            return (
              <li key={status} className="border-b border-dim py-4">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span>{ADMIN_ORDER_STATUS_LABELS[status]}</span>
                  <span className="text-dim">
                    <data value={count} className="font-semibold tabular">
                      {count}
                    </data>{' '}
                    <span className="tabular">({share}%)</span>
                  </span>
                </div>
                <div aria-hidden="true" className="h-2 w-full bg-wash mt-2">
                  <div
                    className="h-full bg-ink"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-dim py-12 mb-0">
          No orders yet. New orders will appear here as buyers check out.
        </p>
      )}
    </section>
  )
}
