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
      <header className="d-flex flex-wrap align-items-baseline justify-content-between gap-2 pb-2">
        <div className="min-w-0">
          <h2 className="mb-0">
            {group.producer.id ? (
              <Link
                to={`/producers/${group.producer.id}`}
                className="cart-row-link"
              >
                {group.producer.name}
              </Link>
            ) : (
              group.producer.name
            )}
          </h2>
          {group.producer.location && (
            <p className="small text-body-secondary mb-0">{group.producer.location}</p>
          )}
        </div>
        <p className="small text-body-secondary mb-0">
          Subtotal{' '}
          <data
            value={group.subtotal}
            className="ms-1 fw-semibold tabular"
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
