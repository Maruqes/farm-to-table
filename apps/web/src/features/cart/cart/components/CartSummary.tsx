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
      className="rule pt-6"
    >
      <h2 id="cart-summary-heading">Order summary</h2>

      <dl className="mt-6 flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="font-normal text-dim">Subtotal</dt>
          <dd className="tabular">{formatMoney(total)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="font-normal text-dim">Delivery</dt>
          <dd className="text-dim">Chosen at checkout</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <span className="font-semibold">Total</span>
        <data value={total} className="price-tag tabular">
          {formatMoney(total)}
        </data>
      </div>

      <Button asChild size="lg" className="mt-6 w-full">
        <Link to="/checkout">Checkout</Link>
      </Button>

      <p className="mt-4 text-xs text-dim">
        {producerCount === 1
          ? 'One producer prepares this order.'
          : `${producerCount} producers — checkout splits this into one order per producer.`}
      </p>

      {saving && (
        <p role="status" className="mt-2 text-xs text-dim">
          Saving your cart…
        </p>
      )}
    </aside>
  )
}
