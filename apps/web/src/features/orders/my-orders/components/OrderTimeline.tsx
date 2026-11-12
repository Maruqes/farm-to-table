import { Check } from 'lucide-react'
import { cn } from '@/components/ui/utils'
import { formatDate } from '@/services/format'
import { ORDER_STATUS_LABELS, ORDER_STATUS_STEPS } from '../my-orders.labels'
import type { OrderStatus, OrderTimelineEntry } from '../my-orders.types'

interface OrderTimelineProps {
  status: OrderStatus
  history: OrderTimelineEntry[]
}

export function OrderTimeline({ status, history }: OrderTimelineProps) {
  const cancelledAt = history.find((entry) => entry.status === 'cancelled')?.date ?? null

  if (status === 'cancelled') {
    return (
      <div className="border px-3 py-2 small text-body-secondary">
        This order was cancelled by the producer. Any stock has been returned to the
        catalog.
        {cancelledAt && (
          <>
            {' '}
            Cancelled on <time dateTime={cancelledAt}>{formatDate(cancelledAt)}</time>.
          </>
        )}
      </div>
    )
  }

  const currentIndex = ORDER_STATUS_STEPS.indexOf(status)

  return (
    <ol className="orders-timeline" aria-label="Order progress">
      {ORDER_STATUS_STEPS.map((step, index) => {
        const reached = index <= currentIndex
        const current = index === currentIndex
        const date = history.find((entry) => entry.status === step)?.date ?? null

        return (
          <li key={step} aria-current={current ? 'step' : undefined} className="min-w-0">
            <div className="orders-step-row">
              <span
                className={cn(
                  'orders-step',
                  reached && 'is-done',
                  current && 'is-now',
                )}
              >
                {reached ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <span aria-hidden="true">{index + 1}</span>
                )}
              </span>
              {index < ORDER_STATUS_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'orders-step-line',
                    index < currentIndex && 'is-done',
                  )}
                />
              )}
            </div>

            <p
              className={cn(
                'orders-step-label',
                reached && 'is-done',
              )}
            >
              {ORDER_STATUS_LABELS[step]}
              <span className="visually-hidden">
                {current ? ' — current status' : reached ? ' — completed' : ' — not yet reached'}
              </span>
            </p>
            <p className="orders-step-date d-none d-md-block mb-0">
              {date ? (
                <time dateTime={date}>{formatDate(date)}</time>
              ) : reached ? (
                '—'
              ) : (
                'Not yet'
              )}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
