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
      className="rule pt-6"
    >
      <h2 id="checkout-summary-heading">
        Order summary
      </h2>
      <p className="mt-1 text-sm text-dim">
        {groups.length === 1
          ? 'This cart becomes one order, sent to the producer.'
          : `This cart becomes ${groups.length} orders, one per producer.`}
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {groups.map((group) => (
          <section
            key={group.producer.id || group.producer.name}
            aria-label={`Summary for ${group.producer.name}`}
          >
            <p className="flex items-baseline justify-between gap-4 text-sm font-medium">
              <span className="min-w-0">{group.producer.name}</span>
              <data value={group.subtotal} className="shrink-0 tabular font-semibold">
                {formatMoney(group.subtotal)}
              </data>
            </p>
            <ul className="board mt-1">
              {group.items.map((item) => (
                <li
                  key={item.productId}
                  className="board-row justify-between gap-4 py-1.5 text-sm"
                >
                  <span className="min-w-0">
                    {item.name}{' '}
                    <span className="whitespace-nowrap text-dim tabular">
                      × {item.quantity} {item.unit}
                      {item.quantity === 1 ? '' : 's'}
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
          </section>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <span className="font-semibold">Total</span>
        <data value={total} className="price-tag tabular">
          {formatMoney(total)}
        </data>
      </div>

      <p className="mt-4 text-xs text-dim">
        You pay each producer directly when you collect or receive the order.
      </p>

      <Button
        type="submit"
        form={CHECKOUT_FORM_ID}
        size="lg"
        className="mt-6 w-full"
        disabled={placing}
      >
        {placing ? 'Placing order…' : 'Place order'}
      </Button>

      <p className="mt-2 text-xs text-dim">
        {groups.length === 1
          ? 'One order will be created.'
          : `${groups.length} separate orders will be created.`}
      </p>
    </aside>
  )
}
