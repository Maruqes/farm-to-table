import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/services/format'

interface CartSummaryProps {
  total: number
  producerCount: number
  saving: boolean
}

export function CartSummary({ total, producerCount, saving }: CartSummaryProps) {
  return (
    <aside
      aria-labelledby="cart-summary-heading"
      className="rounded-xl border bg-card p-5 md:p-6 lg:sticky lg:top-32"
    >
      <h2 id="cart-summary-heading" className="text-lg">
        Order summary
      </h2>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular">{formatMoney(total)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">Delivery</dt>
          <dd className="text-muted-foreground">Chosen at checkout</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-baseline justify-between gap-4 border-t pt-4">
        <span className="text-base font-semibold">Total</span>
        <data value={total} className="font-display text-2xl font-extrabold tabular">
          {formatMoney(total)}
        </data>
      </div>

      <Button asChild className="mt-5 w-full">
        <Link to="/checkout">Checkout</Link>
      </Button>

      <p className="mt-3 text-xs text-muted-foreground">
        {producerCount === 1
          ? 'One producer prepares this order.'
          : `${producerCount} producers — checkout splits this into one order per producer.`}
      </p>

      {saving && (
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          Saving your cart…
        </p>
      )}
    </aside>
  )
}
