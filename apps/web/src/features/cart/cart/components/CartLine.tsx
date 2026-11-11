import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/services/format'
import { CategoryIcon } from '@/features/catalog/home-catalog/components/CategoryIcon'
import type { CartItem } from '../cart.types'
import { CartQuantityStepper } from './CartQuantityStepper'

const TILE: Record<string, string> = {
  fruit: 'bg-tile-fruit',
  honey: 'bg-tile-honey',
  wine: 'bg-tile-wine',
  cheese: 'bg-tile-cheese',
  bakery: 'bg-tile-bakery',
}

interface CartLineProps {
  item: CartItem
  onQuantityChange: (productId: string, quantity: number) => void
  onRemove: (productId: string) => void
}

export function CartLine({ item, onQuantityChange, onRemove }: CartLineProps) {
  const lineTotal = item.price * item.quantity
  const atStockLimit = item.quantity >= item.stock

  return (
    <li className="flex gap-3 px-4 py-4 md:gap-4 md:px-6">
      <div
        className={`grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg sm:size-16 ${
          TILE[item.category] ?? 'bg-tile-veg'
        }`}
      >
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover"
          />
        ) : (
          <CategoryIcon category={item.category} className="size-7" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <h3 className="text-base leading-snug">
              <Link to={`/products/${item.productId}`} className="hover:text-primary">
                {item.name}
              </Link>
            </h3>
            <p className="text-sm text-muted-foreground">
              {formatMoney(item.price)} per {item.unit}
            </p>
          </div>
          <data
            value={lineTotal}
            className="shrink-0 font-display text-lg font-extrabold tabular"
          >
            {formatMoney(lineTotal)}
          </data>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
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
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.productId)}
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remove
          </Button>
        </div>

        {atStockLimit && (
          <p className="text-xs text-muted-foreground">
            Only{' '}
            <data value={item.stock} className="tabular font-medium text-foreground">
              {item.stock} {item.unit}
              {item.stock === 1 ? '' : 's'}
            </data>{' '}
            left in stock.
          </p>
        )}
      </div>
    </li>
  )
}
