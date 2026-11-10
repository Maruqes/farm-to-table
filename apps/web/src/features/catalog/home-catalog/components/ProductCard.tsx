import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { CategoryIcon } from './CategoryIcon'
import { formatMoney } from '@/services/format'
import { categoryLabel } from '../catalog-options'
import type { Product } from '../catalog.types'

const TILE: Record<string, string> = {
  fruit: 'bg-tile-fruit',
  honey: 'bg-tile-honey',
  wine: 'bg-tile-wine',
  cheese: 'bg-tile-cheese',
  bakery: 'bg-tile-bakery',
}


export function ProductCard({ product }: { product: Product }) {
  const productHref = `/products/${product.id}`

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card transition-colors hover:border-foreground/30">
      <Link to={productHref} className="block">
        <div className={`aspect-[16/9] ${TILE[product.category] ?? 'bg-tile-veg'}`}>
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <CategoryIcon category={product.category} />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg leading-snug">
            <Link to={productHref} className="hover:text-primary">
              {product.name}
            </Link>
          </h3>
          <data value={product.price} className="tabular shrink-0 font-display text-lg font-extrabold">
            {formatMoney(product.price)}
          </data>
        </div>

        <p className="text-sm text-muted-foreground">
          {product.producer.name}
          {product.producer.location ? ` · ${product.producer.location}` : ''}
        </p>

        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-sm text-muted-foreground">
          <span>
            {categoryLabel(product.category)} · per {product.unit}
          </span>
          <span className="flex items-center gap-1">
            <Star className="size-3.5 fill-current" aria-hidden="true" />
            <span className="tabular font-medium text-foreground">
              {product.averageRating.toFixed(1)}
            </span>
            <span className="sr-only">out of 5</span>
          </span>
        </div>
      </div>
    </article>
  )
}
