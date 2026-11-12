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
    <section aria-label={`${group.producer.name} in your cart`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2 pb-2">
        <div className="min-w-0">
          <h2>
            {group.producer.id ? (
              <Link
                to={`/producers/${group.producer.id}`}
                className="no-underline hover:underline"
              >
                {group.producer.name}
              </Link>
            ) : (
              group.producer.name
            )}
          </h2>
          {group.producer.location && (
            <p className="text-sm text-dim">{group.producer.location}</p>
          )}
        </div>
        <p className="text-sm text-dim">
          Subtotal{' '}
          <data
            value={group.subtotal}
            className="ml-1 font-semibold tabular"
          >
            {formatMoney(group.subtotal)}
          </data>
        </p>
      </header>

      <ul className="board">
        {group.items.map((item) => (
          <CartLine
            key={item.productId}
            item={item}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </section>
  )
}
