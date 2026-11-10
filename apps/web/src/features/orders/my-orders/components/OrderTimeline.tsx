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
  const currentIndex = ORDER_STATUS_STEPS.indexOf(status)

  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Order progress">
      {ORDER_STATUS_STEPS.map((step, index) => {
        const reached = index <= currentIndex
        const current = index === currentIndex
        const date = history.find((entry) => entry.status === step)?.date ?? null

        return (
          <li key={step} aria-current={current ? 'step' : undefined} className="min-w-0">
            <div className="flex items-center">
              <span
                className={cn(
                  'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold',
                  reached
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-muted-foreground',
                  current && 'ring-2 ring-ring ring-offset-2 ring-offset-card',
                )}
              >
                {reached ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <span aria-hidden="true">{index + 1}</span>
                )}
              </span>
              {index < ORDER_STATUS_STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mx-1 h-0.5 flex-1 rounded-full',
                    index < currentIndex ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}
            </div>

            <p
              className={cn(
                'mt-2 text-xs font-medium leading-tight',
                reached ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {ORDER_STATUS_LABELS[step]}
              <span className="sr-only">
                {current ? ' — current status' : reached ? ' — completed' : ' — not yet reached'}
              </span>
            </p>
            <p className="mt-0.5 hidden text-xs text-muted-foreground md:block">
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
