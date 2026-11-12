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
      <div className="border border-dim px-4 py-2 text-sm text-dim">
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
    <ol className="m-0 grid list-none grid-cols-4 gap-1 p-0" aria-label="Order progress">
      {ORDER_STATUS_STEPS.map((step, index) => {
        const reached = index <= currentIndex
        const current = index === currentIndex
        const date = history.find((entry) => entry.status === step)?.date ?? null

        return (
          <li key={step} aria-current={current ? 'step' : undefined} className="min-w-0">
            <div className="flex items-center">
              <span
                className={cn(
                  'grid size-7 flex-none place-items-center border-2 border-dim text-xs font-semibold text-dim',
                  reached && 'border-ink bg-ink text-paper',
                  current && 'outline-2 outline-offset-2 outline-ink',
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
                    'mx-1 h-0.5 flex-auto bg-dim',
                    index < currentIndex && 'bg-ink',
                  )}
                />
              )}
            </div>

            <p
              className={cn(
                'mt-2 text-xs font-medium leading-tight text-dim',
                reached && 'text-ink',
              )}
            >
              {ORDER_STATUS_LABELS[step]}
              <span className="sr-only">
                {current ? ' — current status' : reached ? ' — completed' : ' — not yet reached'}
              </span>
            </p>
            <p className="mt-0.5 hidden text-xs text-dim md:block">
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
