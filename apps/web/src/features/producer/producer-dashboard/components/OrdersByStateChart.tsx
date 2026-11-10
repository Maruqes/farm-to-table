import type { OrderStatus } from '@/features/orders/my-orders/my-orders.types'
import {
  DASHBOARD_ORDER_STATUSES,
  DASHBOARD_STATUS_LABELS,
} from '../producer-dashboard.labels'

interface OrdersByStateChartProps {
  byStatus: Record<OrderStatus, number>
}

export function OrdersByStateChart({ byStatus }: OrdersByStateChartProps) {
  const total = DASHBOARD_ORDER_STATUSES.reduce(
    (sum, status) => sum + byStatus[status],
    0,
  )

  return (
    <section
      aria-labelledby="orders-by-state-heading"
      className="rounded-xl border bg-card p-4 md:p-6"
    >
      <div className="space-y-1">
        <h2 id="orders-by-state-heading" className="text-xl md:text-2xl">
          Orders by state
        </h2>
        <p className="text-sm text-muted-foreground">
          Where your orders are in the pickup or delivery process.
        </p>
      </div>

      {total > 0 ? (
        <ul className="mt-5 space-y-4">
          {DASHBOARD_ORDER_STATUSES.map((status) => {
            const count = byStatus[status]
            const share = total > 0 ? Math.round((count / total) * 100) : 0

            return (
              <li key={status} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span>{DASHBOARD_STATUS_LABELS[status]}</span>
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
          No orders yet. New orders will appear here as they arrive.
        </p>
      )}
    </section>
  )
}
