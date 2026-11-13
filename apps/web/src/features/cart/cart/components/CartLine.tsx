import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CrateChip } from '@/components/board'
import { lotNumber } from '@/components/crate'
import { formatMoney } from '@/services/format'
import type { CartItem } from '../cart.types'
import { CartQuantityStepper } from './CartQuantityStepper'

interface CartLineProps {
  item: CartItem
  onQuantityChange: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function CartLine({ item, onQuantityChange, onRemove }: CartLineProps) {
  const lineTotal = item.price * item.quantity
  const atStockLimit = item.quantity >= item.stock

  return (
    <li className="board-row flex-wrap">
      <CrateChip category={item.category} imageUrl={item.imageUrl} />
      <span className="lot tabular" aria-hidden="true">
        {lotNumber(item.productId)}
      </span>

      <div className="min-w-0 flex-[1_1_9rem]">
        <h3>
          <Link
            to={`/products/${item.productId}`}
            className="no-underline hover:underline"
          >
            {item.name}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-dim">
          {item.producer.name}
          {item.producer.location ? ` · ${item.producer.location}` : ''}
        </p>
        {atStockLimit && (
          <p className="mt-1 text-xs text-dim">
            Only{' '}
            <data value={item.stock} className="tabular font-medium">
              {item.stock} {item.unit}
              {item.stock === 1 ? '' : 's'}
            </data>{' '}
            left in stock.
          </p>
        )}
      </div>

      <div className="text-right">
        <data value={lineTotal} className="price tabular">
          {formatMoney(lineTotal)}
        </data>
        <p className="mt-1 text-xs text-dim tabular">
          {formatMoney(item.price)} per {item.unit}
        </p>
      </div>

      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <CartQuantityStepper
          productId={item.productId}
          productName={item.name}
          quantity={item.quantity}
          stock={item.stock}
          onChange={(quantity) => onQuantityChange(item.productId, quantity)}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.productId)}
          aria-label={`Remove ${item.name} from cart`}
        >
          <Trash2 size={16} aria-hidden="true" />
          Remove
        </Button>
      </div>
    </li>
  )
}
