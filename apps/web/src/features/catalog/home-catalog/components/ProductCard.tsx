import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CrateChip } from '@/components/board'
import { lotNumber } from '@/components/crate'
import { formatMoney } from '@/services/format'
import type { Product } from '../catalog.types'

// One row of the painted price board (RULES.md): crate chip, lot number,
// name with producer and place underneath, price with "per unit", one action.
// Product photos are not shown in rows. Secondary info stays out so the row
// fits at 375px: chip, lot, name, price and action only.
export function ProductCard({ product }: { product: Product }) {
  const productHref = `/products/${product.id}`

  return (
    <li className="board-row">
      <CrateChip category={product.category} />
      <span className="lot tabular">{lotNumber(product.id)}</span>
      <div className="min-w-0 flex-grow-1">
        <h3>
          <Link to={productHref}>{product.name}</Link>
        </h3>
        <p className="text-truncate small text-body-secondary">
          {product.producer.name}
          {product.producer.location ? ` · ${product.producer.location}` : ''}
        </p>
      </div>
      <div className="flex-shrink-0 text-end">
        <data value={product.price} className="price tabular">
          {formatMoney(product.price)}
        </data>
        <small className="d-block small text-body-secondary">
          per {product.unit}
        </small>
      </div>
      <Button asChild size="sm" className="flex-shrink-0">
        <Link to={productHref} aria-label={`View ${product.name}`}>
          View
        </Link>
      </Button>
    </li>
  )
}
