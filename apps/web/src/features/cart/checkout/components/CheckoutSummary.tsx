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
      className="rounded-xl border bg-card p-5 md:p-6 lg:sticky lg:top-32"
    >
      <h2 id="checkout-summary-heading" className="text-lg">
        Order summary
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {groups.length === 1
          ? 'This cart becomes one order, sent to the producer.'
          : `This cart becomes ${groups.length} orders, one per producer.`}
      </p>

      <ul className="mt-4 space-y-4">
        {groups.map((group) => (
          <li key={group.producer.id || group.producer.name} className="space-y-1.5">
            <p className="flex items-baseline justify-between gap-3 text-sm font-medium">
              <span className="min-w-0">{group.producer.name}</span>
              <data value={group.subtotal} className="shrink-0 tabular font-semibold">
                {formatMoney(group.subtotal)}
              </data>
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {group.items.map((item) => (
                <li key={item.productId}>
                  {item.name}{' '}
                  <span className="whitespace-nowrap tabular">
                    × {item.quantity} {item.unit}
                    {item.quantity === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t pt-4">
        <span className="text-base font-semibold">Total</span>
        <data value={total} className="font-display text-2xl font-extrabold tabular">
          {formatMoney(total)}
        </data>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        You pay each producer directly when you collect or receive the order.
      </p>

      <Button
        type="submit"
        form={CHECKOUT_FORM_ID}
        size="lg"
        className="mt-5 w-full"
        disabled={placing}
      >
        {placing ? 'Placing order…' : 'Place order'}
      </Button>

      <p className="mt-2 text-xs text-muted-foreground">
        {groups.length === 1
          ? 'One order will be created.'
          : `${groups.length} separate orders will be created.`}
      </p>
    </aside>
  )
}
