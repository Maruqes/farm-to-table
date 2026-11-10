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
    <section
      aria-labelledby={headingId}
      className="rounded-xl border bg-card p-4 md:p-6"
    >
      <div className="space-y-1">
        <h2 id={headingId} className="text-xl md:text-2xl">
          Orders by state
        </h2>
        <p className="text-sm text-muted-foreground">
          Every order on the marketplace, by where it is in the process.
        </p>
      </div>

      {total > 0 ? (
        <ul className="mt-5 space-y-4">
          {ADMIN_ORDER_STATUSES.map((status) => {
            const count = byStatus[status]
            const share = total > 0 ? Math.round((count / total) * 100) : 0

            return (
              <li key={status} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{ADMIN_ORDER_STATUS_LABELS[status]}</span>
                  <span className="text-muted-foreground">
                    <data value={count} className="font-medium text-foreground tabular">
                      {count}
                    </data>{' '}
                    <span className="tabular">({share}%)</span>
                  </span>
                </div>
                <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${share}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="py-10 text-sm text-muted-foreground">
          No orders yet. New orders will appear here as buyers check out.
        </p>
      )}
    </section>
  )
}
