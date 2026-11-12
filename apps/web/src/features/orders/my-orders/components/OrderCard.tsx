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
      className="rule pt-4"
    >
      <header className="d-flex flex-wrap align-items-start justify-content-between gap-3">
        <div className="min-w-0 vstack gap-1">
          <h2 id={headingId} className="mb-0">
            {producer.name}
          </h2>
          <p className="d-flex flex-wrap align-items-center gap-2 small text-body-secondary mb-0">
            {producer.location && (
              <span className="d-inline-flex align-items-center gap-2">
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

      <div className="mt-4 vstack gap-4">
        <OrderTimeline status={order.status} history={order.history} />

        <div>
          <h3 className="label-line mb-0">Items</h3>
          <ul className="board mt-1">
            {order.items.map((item, index) => (
              <li
                key={`${item.productId}-${index}`}
                className="board-row justify-content-between gap-3 small orders-compact"
              >
                <span className="min-w-0">
                  {item.name}{' '}
                  <span className="text-nowrap text-body-secondary tabular">
                    × {item.quantity} {item.unit}
                  </span>
                </span>
                <data
                  value={item.price * item.quantity}
                  className="flex-shrink-0 text-body-secondary tabular"
                >
                  {formatMoney(item.price * item.quantity)}
                </data>
              </li>
            ))}
          </ul>
          <p className="mt-3 d-flex flex-wrap align-items-center justify-content-between gap-3 mb-0">
            <span className="small text-body-secondary">Total</span>
            <data value={order.total} className="price-tag tabular">
              {formatMoney(order.total)}
            </data>
          </p>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2 border-top pt-4">
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
          <div className="vstack gap-1 border-top pt-4">
            <p className="d-flex flex-wrap align-items-center gap-2 small mb-0">
              <RatingStars rating={order.review.rating} />
              <span className="fw-medium tabular">{order.review.rating} of 5</span>
              <span className="text-body-secondary">your rating</span>
            </p>
            {order.review.text && (
              <p className="measure small text-body-secondary mb-0">
                {order.review.text}
              </p>
            )}
            <p className="orders-note mb-0">
              Ratings cannot be changed once submitted.
            </p>
          </div>
        )}

        {!order.review && order.reviewed && (
          <p className="border-top pt-4 small text-body-secondary mb-0">
            You rated this order. Ratings cannot be changed once submitted.
          </p>
        )}
      </div>
    </article>
  )
}
