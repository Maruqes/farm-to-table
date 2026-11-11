import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      <section className="space-y-4">
        <h1>No orders created</h1>
        <p className="text-muted-foreground">
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
    <section aria-labelledby="order-success-heading" className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
          <CircleCheck className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1">
          <h1 ref={headingRef} tabIndex={-1} id="order-success-heading">
            Order placed
          </h1>
          <p className="max-w-prose text-muted-foreground">
            {orders.length === 1
              ? 'The producer has your order and will confirm it soon.'
              : `We split your cart into ${orders.length} orders, one for each producer. Each farm will confirm its own order.`}
          </p>
        </div>
      </div>

      {input && (
        <p className="text-sm text-muted-foreground">{fulfilmentSummary(input)}</p>
      )}

      <div className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3 md:px-6 md:py-4">
          <h2 className="text-lg">Your orders</h2>
          <p className="text-sm text-muted-foreground">
            Total{' '}
            <data
              value={total}
              className="ml-1 font-semibold text-foreground tabular"
            >
              {formatMoney(total)}
            </data>
          </p>
        </div>

        <ul className="divide-y">
          {orders.map((order) => (
            <li
              key={order.id}
              className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] md:items-start md:px-6"
            >
              <div className="space-y-1">
                <p className="font-semibold">{order.producer.name}</p>
                {input?.fulfilment === 'pickup' && order.producer.location && (
                  <p className="text-sm text-muted-foreground">
                    Pickup at {order.producer.location}
                  </p>
                )}
              </div>

              <ul className="space-y-0.5 text-sm text-muted-foreground">
                {order.items.map((item, index) => (
                  <li key={`${item.productId}-${index}`}>
                    {item.name}{' '}
                    <span className="whitespace-nowrap tabular">
                      × {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between gap-3 md:flex-col md:items-end">
                <data
                  value={order.total}
                  className="font-display text-lg font-extrabold tabular"
                >
                  {formatMoney(order.total)}
                </data>
                <Badge variant="outline">{ORDER_STATUS_LABELS[order.status]}</Badge>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/">Browse the catalog</Link>
        </Button>
      </div>
    </section>
  )
}
