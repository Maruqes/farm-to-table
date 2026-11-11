import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { DashboardLowStockItem } from '../producer-dashboard.types'

interface LowStockListProps {
  items: DashboardLowStockItem[]
}

export function LowStockList({ items }: LowStockListProps) {
  return (
    <section aria-labelledby="low-stock-heading" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="low-stock-heading" className="text-xl md:text-2xl">
          Low stock
        </h2>
        <p className="text-sm text-muted-foreground">
          Restock before the next order arrives.
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border bg-card px-4 py-6 text-sm text-muted-foreground">
          No products need restocking right now.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {items.map((item) => (
            <li
              key={item.productId}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6"
            >
              <span className="min-w-0">
                <span className="block font-medium">{item.name}</span>
                <span className="block text-sm text-muted-foreground">
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
