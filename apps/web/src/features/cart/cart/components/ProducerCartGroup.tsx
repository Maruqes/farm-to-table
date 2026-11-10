import { Link } from 'react-router-dom'
import { formatMoney } from '@/services/format'
import type { CartGroup } from '../cart.types'
import { CartLine } from './CartLine'

interface ProducerCartGroupProps {
  group: CartGroup
  onQuantityChange: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function ProducerCartGroup({
  group,
  onQuantityChange,
  onRemove,
}: ProducerCartGroupProps) {
  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b px-4 py-3 md:px-6 md:py-4">
        <div className="min-w-0">
          <h2 className="text-lg">
            {group.producer.id ? (
              <Link
                to={`/producers/${group.producer.id}`}
                className="hover:text-primary"
              >
                {group.producer.name}
              </Link>
            ) : (
              group.producer.name
            )}
          </h2>
          {group.producer.location && (
            <p className="text-sm text-muted-foreground">{group.producer.location}</p>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Subtotal{' '}
          <data
            value={group.subtotal}
            className="ml-1 font-semibold text-foreground tabular"
          >
            {formatMoney(group.subtotal)}
          </data>
        </p>
      </header>

      <ul className="divide-y">
        {group.items.map((item) => (
          <CartLine
            key={item.productId}
            item={item}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </article>
  )
}
