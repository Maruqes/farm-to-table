import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/services/format'
import { ORDER_STATUS_LABELS } from '../checkout.labels'
import type { CheckoutInput, PlacedOrder } from '../checkout.types'

function fulfilmentSummary(input: CheckoutInput): string {
  if (input.fulfilment === 'delivery' && input.address) {
    return `Delivery to ${input.address.line1}, ${input.address.city} ${input.address.postalCode}. Pay on delivery.`
  }
  return 'Pickup at each farm. Pay when you collect.'
}

interface OrderSuccessProps {
  orders: PlacedOrder[]
  input: CheckoutInput | null
}

export function OrderSuccess({ orders, input }: OrderSuccessProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  if (orders.length === 0) {
    return (
      <section className="vstack gap-4">
        <h1 className="mb-0">No orders created</h1>
        <p className="text-body-secondary mb-0">
          Your cart is still available. Go back to review it and try again.
        </p>
        <Button asChild>
          <Link to="/cart">Back to cart</Link>
        </Button>
      </section>
    )
  }

  const total = orders.reduce((sum, order) => sum + order.total, 0)

  return (
    <section aria-labelledby="order-success-heading" className="vstack gap-4">
      <div className="d-flex align-items-start gap-3">
        <span
          aria-hidden="true"
          className="checkout-success-badge"
        >
          <CircleCheck size={24} aria-hidden="true" />
        </span>
        <div className="vstack gap-1">
          <h1 ref={headingRef} tabIndex={-1} id="order-success-heading" className="mb-0">
            Order placed
          </h1>
          <p className="measure text-body-secondary mb-0">
            {orders.length === 1
              ? 'The producer has your order and will confirm it soon.'
              : `We split your cart into ${orders.length} orders, one for each producer. Each farm will confirm its own order.`}
          </p>
        </div>
      </div>

      {input && (
        <p className="small text-body-secondary mb-0">{fulfilmentSummary(input)}</p>
      )}

      <div className="rule pt-4">
        <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
          <h2 className="mb-0">Your orders</h2>
          <p className="small text-body-secondary mb-0">
            Total{' '}
            <data
              value={total}
              className="ms-1 fw-semibold tabular"
            >
              {formatMoney(total)}
            </data>
          </p>
        </div>

        <ul className="board mt-2">
          {orders.map((order) => (
            <li key={order.id} className="board-row flex-wrap align-items-start">
              <div className="checkout-success-main">
                <p className="fw-semibold mb-0">{order.producer.name}</p>
                {input?.fulfilment === 'pickup' && order.producer.location && (
                  <p className="mt-1 small text-body-secondary mb-0">
                    Pickup at {order.producer.location}
                  </p>
                )}
                <ul className="list-unstyled mt-2 small text-body-secondary vstack gap-0 mb-0">
                  {order.items.map((item, index) => (
                    <li key={`${item.productId}-${index}`}>
                      {item.name}{' '}
                      <span className="text-nowrap tabular">
                        × {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ms-auto d-flex flex-column align-items-end gap-2">
                <data
                  value={order.total}
                  className="price tabular"
                >
                  {formatMoney(order.total)}
                </data>
                <Badge variant="outline">
                  {ORDER_STATUS_LABELS[order.status]}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="d-flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/">Browse the catalog</Link>
        </Button>
      </div>
    </section>
  )
}
