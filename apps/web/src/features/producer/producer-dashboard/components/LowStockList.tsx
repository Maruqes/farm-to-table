import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { lotNumber } from '@/components/crate'
import type { DashboardLowStockItem } from '../producer-dashboard.types'

interface LowStockListProps {
  items: DashboardLowStockItem[]
}

export function LowStockList({ items }: LowStockListProps) {
  return (
    <section aria-labelledby="low-stock-heading" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="low-stock-heading">Low stock</h2>
        <p className="text-sm text-dim">
          Restock before the next order arrives.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="border border-dashed border-dim p-6 px-4 text-sm text-dim [&>p]:m-0">No products need restocking right now.</p>
      ) : (
        <ul className="board">
          {items.map((item) => (
            <li key={item.productId} className="board-row flex-wrap">
              <span aria-hidden="true" className="lot">
                {lotNumber(item.productId)}
              </span>
              <span className="min-w-0 grow">
                <span className="block font-semibold">{item.name}</span>
                <span className="block text-sm text-dim">
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
