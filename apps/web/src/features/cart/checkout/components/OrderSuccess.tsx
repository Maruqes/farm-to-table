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
      <section className="flex flex-col gap-6">
        <h1>No orders created</h1>
        <p className="text-dim">
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
    <section aria-labelledby="order-success-heading" className="flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="grid size-11 flex-none place-items-center border-2 border-ink"
        >
          <CircleCheck size={24} aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-1">
          <h1 ref={headingRef} tabIndex={-1} id="order-success-heading">
            Order placed
          </h1>
          <p className="measure text-dim">
            {orders.length === 1
              ? 'The producer has your order and will confirm it soon.'
              : `We split your cart into ${orders.length} orders, one for each producer. Each farm will confirm its own order.`}
          </p>
        </div>
      </div>

      {input && (
        <p className="text-sm text-dim">{fulfilmentSummary(input)}</p>
      )}

      <div className="rule pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2>Your orders</h2>
          <p className="text-sm text-dim">
            Total{' '}
            <data
              value={total}
              className="ml-1 font-semibold tabular"
            >
              {formatMoney(total)}
            </data>
          </p>
        </div>

        <ul className="board mt-2">
          {orders.map((order) => (
            <li key={order.id} className="board-row flex-wrap items-start">
              <div className="min-w-0 flex-[1_1_10rem]">
                <p className="font-semibold">{order.producer.name}</p>
                {input?.fulfilment === 'pickup' && order.producer.location && (
                  <p className="mt-1 text-sm text-dim">
                    Pickup at {order.producer.location}
                  </p>
                )}
                <ul className="mt-2 flex list-none flex-col gap-0 p-0 text-sm text-dim">
                  {order.items.map((item, index) => (
                    <li key={`${item.productId}-${index}`}>
                      {item.name}{' '}
                      <span className="whitespace-nowrap tabular">
                        × {item.quantity} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="ml-auto flex flex-col items-end gap-2">
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

      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link to="/">Browse the catalog</Link>
        </Button>
      </div>
    </section>
  )
}
