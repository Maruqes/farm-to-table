import { useId } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RatingStars } from '@/features/catalog/product-detail/components/RatingStars'
import { formatDate, formatMoney } from '@/services/format'
import { ORDER_STATUS_LABELS } from '../my-orders.labels'
import type { MyOrder, RateResult } from '../my-orders.types'
import { OrderTimeline } from './OrderTimeline'
import { ProducerMapButton } from './ProducerMapButton'
import { RateDialog } from './RateDialog'

interface OrderCardProps {
  order: MyOrder
  onRate: (orderId: string, rating: number, text: string) => Promise<RateResult>
}

function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export function OrderCard({ order, onRate }: OrderCardProps) {
  const headingId = useId()
  const { producer } = order
  const placed =
    order.history.find((entry) => entry.status === 'pending')?.date ??
    order.history[0]?.date ??
    null

  return (
    <article className="rounded-xl border bg-card" aria-labelledby={headingId}>
      <header className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-4 md:px-6 md:py-5">
        <div className="min-w-0 space-y-1">
          <h2 id={headingId} className="text-xl md:text-2xl">
            {producer.name}
          </h2>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {producer.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden="true" />
                {producer.location}
              </span>
            )}
            {placed && (
              <span>
                Placed <time dateTime={placed}>{formatDate(placed)}</time>
              </span>
            )}
          </p>
        </div>
        <Badge variant={order.status === 'delivered' ? 'secondary' : 'outline'}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </header>

      <div className="space-y-5 px-4 py-4 md:px-6 md:py-5">
        <OrderTimeline status={order.status} history={order.history} />

        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Items</h3>
            <ul className="space-y-1.5 text-sm">
              {order.items.map((item, index) => (
                <li
                  key={`${item.productId}-${index}`}
                  className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5"
                >
                  <span>
                    {item.name}{' '}
                    <span className="whitespace-nowrap text-muted-foreground">
                      × {item.quantity} {item.unit}
                    </span>
                  </span>
                  <data
                    value={item.price * item.quantity}
                    className="text-muted-foreground tabular"
                  >
                    {formatMoney(item.price * item.quantity)}
                  </data>
                </li>
              ))}
            </ul>
          </div>

          <p className="border-t pt-3 text-sm text-muted-foreground md:border-t-0 md:pt-0 md:text-right">
            Total{' '}
            <data
              value={order.total}
              className="ml-1 font-display text-xl font-extrabold text-foreground tabular"
            >
              {formatMoney(order.total)}
            </data>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          {producer.email && (
            <Button asChild variant="outline">
              <a
                href={`mailto:${producer.email}`}
                aria-label={`Contact ${producer.name} by email`}
              >
                <Mail aria-hidden="true" />
                Contact
              </a>
            </Button>
          )}
          {!producer.email && producer.phone && (
            <Button asChild variant="outline">
              <a
                href={phoneHref(producer.phone)}
                aria-label={`Call ${producer.name}`}
              >
                <Phone aria-hidden="true" />
                Call
              </a>
            </Button>
          )}
          <ProducerMapButton producer={producer} />
          {order.status === 'delivered' && !order.reviewed && (
            <RateDialog order={order} onSubmit={onRate} />
          )}
        </div>

        {order.review && (
          <div className="space-y-1 border-t pt-4">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <RatingStars rating={order.review.rating} />
              <span className="font-medium tabular">{order.review.rating} of 5</span>
              <span className="text-muted-foreground">your rating</span>
            </p>
            {order.review.text && (
              <p className="max-w-prose text-sm text-muted-foreground">
                {order.review.text}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Ratings cannot be changed once submitted.
            </p>
          </div>
        )}

        {!order.review && order.reviewed && (
          <p className="border-t pt-4 text-sm text-muted-foreground">
            You rated this order. Ratings cannot be changed once submitted.
          </p>
        )}
      </div>
    </article>
  )
}
