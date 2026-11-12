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
      className="rule pt-4"
    >
      <h2 id="cart-summary-heading">Order summary</h2>

      <dl className="mt-4 small vstack gap-2 mb-0">
        <div className="d-flex align-items-baseline justify-content-between gap-3">
          <dt className="fw-normal text-body-secondary">Subtotal</dt>
          <dd className="tabular mb-0">{formatMoney(total)}</dd>
        </div>
        <div className="d-flex align-items-baseline justify-content-between gap-3">
          <dt className="fw-normal text-body-secondary">Delivery</dt>
          <dd className="text-body-secondary mb-0">Chosen at checkout</dd>
        </div>
      </dl>

      <div className="mt-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <span className="fw-semibold">Total</span>
        <data value={total} className="price-tag tabular">
          {formatMoney(total)}
        </data>
      </div>

      <Button asChild size="lg" className="mt-4 w-100">
        <Link to="/checkout">Checkout</Link>
      </Button>

      <p className="mt-3 cart-note mb-0">
        {producerCount === 1
          ? 'One producer prepares this order.'
          : `${producerCount} producers — checkout splits this into one order per producer.`}
      </p>

      {saving && (
        <p role="status" className="mt-2 cart-note mb-0">
          Saving your cart…
        </p>
      )}
    </aside>
  )
}
