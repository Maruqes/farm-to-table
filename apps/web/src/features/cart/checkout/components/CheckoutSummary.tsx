import { Button } from '@/components/ui/button'
import { formatMoney } from '@/services/format'
import type { CartGroup } from '../../cart/cart.types'
import { CHECKOUT_FORM_ID } from './CheckoutForm'

interface CheckoutSummaryProps {
  groups: CartGroup[]
  total: number
  placing: boolean
}

export function CheckoutSummary({
  groups,
  total,
  placing,
}: CheckoutSummaryProps) {
  return (
    <aside
      aria-labelledby="checkout-summary-heading"
      className="rule pt-4"
    >
      <h2 id="checkout-summary-heading" className="mb-0">
        Order summary
      </h2>
      <p className="mt-1 small text-body-secondary mb-0">
        {groups.length === 1
          ? 'This cart becomes one order, sent to the producer.'
          : `This cart becomes ${groups.length} orders, one per producer.`}
      </p>

      <div className="mt-4 vstack gap-4">
        {groups.map((group) => (
          <section
            key={group.producer.id || group.producer.name}
            aria-label={`Summary for ${group.producer.name}`}
          >
            <p className="d-flex align-items-baseline justify-content-between gap-3 small fw-medium mb-0">
              <span className="min-w-0">{group.producer.name}</span>
              <data value={group.subtotal} className="flex-shrink-0 tabular fw-semibold">
                {formatMoney(group.subtotal)}
              </data>
            </p>
            <ul className="board mt-1">
              {group.items.map((item) => (
                <li
                  key={item.productId}
                  className="board-row justify-content-between gap-3 small checkout-compact"
                >
                  <span className="min-w-0">
                    {item.name}{' '}
                    <span className="text-nowrap text-body-secondary tabular">
                      × {item.quantity} {item.unit}
                      {item.quantity === 1 ? '' : 's'}
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
          </section>
        ))}
      </div>

      <div className="mt-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <span className="fw-semibold">Total</span>
        <data value={total} className="price-tag tabular">
          {formatMoney(total)}
        </data>
      </div>

      <p className="mt-3 checkout-note mb-0">
        You pay each producer directly when you collect or receive the order.
      </p>

      <Button
        type="submit"
        form={CHECKOUT_FORM_ID}
        size="lg"
        className="mt-4 w-100"
        disabled={placing}
      >
        {placing ? 'Placing order…' : 'Place order'}
      </Button>

      <p className="mt-2 checkout-note mb-0">
        {groups.length === 1
          ? 'One order will be created.'
          : `${groups.length} separate orders will be created.`}
      </p>
    </aside>
  )
}
