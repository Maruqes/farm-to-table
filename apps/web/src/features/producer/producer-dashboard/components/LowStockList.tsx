import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { lotNumber } from '@/components/crate'
import type { DashboardLowStockItem } from '../producer-dashboard.types'

interface LowStockListProps {
  items: DashboardLowStockItem[]
}

export function LowStockList({ items }: LowStockListProps) {
  return (
    <section aria-labelledby="low-stock-heading" className="vstack gap-3">
      <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
        <h2 id="low-stock-heading">Low stock</h2>
        <p className="small text-body-secondary">
          Restock before the next order arrives.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="pa-empty">No products need restocking right now.</p>
      ) : (
        <ul className="board">
          {items.map((item) => (
            <li key={item.productId} className="board-row flex-wrap">
              <span aria-hidden="true" className="lot">
                {lotNumber(item.productId)}
              </span>
              <span className="min-w-0 flex-grow-1">
                <span className="d-block fw-semibold">{item.name}</span>
                <span className="d-block small text-body-secondary">
                  <data value={item.stock} className="tabular">
                    {item.stock}
                  </data>{' '}
                  left
                </span>
              </span>
              <Button asChild variant="outline">
                <Link
                  to="/producer/products"
                  aria-label={`Restock ${item.name}`}
                >
                  Restock
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
