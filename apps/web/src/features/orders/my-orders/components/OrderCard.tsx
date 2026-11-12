import { useId } from 'react'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    <article
      aria-labelledby={headingId}
      className="rule pt-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={headingId}>
            {producer.name}
          </h2>
          <p className="flex flex-wrap items-center gap-2 text-sm text-dim">
            {producer.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin size={16} aria-hidden="true" />
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
        <Badge variant={order.status === 'cancelled' ? 'destructive' : 'outline'}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </header>

      <div className="mt-6 flex flex-col gap-6">
        <OrderTimeline status={order.status} history={order.history} />

        <div>
          <h3 className="label-line">Items</h3>
          <ul className="board mt-1">
            {order.items.map((item, index) => (
              <li
                key={`${item.productId}-${index}`}
                className="board-row justify-between gap-4 py-1.5 text-sm"
              >
                <span className="min-w-0">
                  {item.name}{' '}
                  <span className="whitespace-nowrap text-dim tabular">
                    × {item.quantity} {item.unit}
                  </span>
                </span>
                <data
                  value={item.price * item.quantity}
                  className="shrink-0 text-dim tabular"
                >
                  {formatMoney(item.price * item.quantity)}
                </data>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <span className="text-sm text-dim">Total</span>
            <data value={order.total} className="price-tag tabular">
              {formatMoney(order.total)}
            </data>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-ink pt-6">
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
          <div className="flex flex-col gap-1 border-t border-ink pt-6">
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <RatingStars rating={order.review.rating} />
              <span className="font-medium tabular">{order.review.rating} of 5</span>
              <span className="text-dim">your rating</span>
            </p>
            {order.review.text && (
              <p className="measure text-sm text-dim">
                {order.review.text}
              </p>
            )}
            <p className="text-xs text-dim">
              Ratings cannot be changed once submitted.
            </p>
          </div>
        )}

        {!order.review && order.reviewed && (
          <p className="border-t border-ink pt-6 text-sm text-dim">
            You rated this order. Ratings cannot be changed once submitted.
          </p>
        )}
      </div>
    </article>
  )
}
