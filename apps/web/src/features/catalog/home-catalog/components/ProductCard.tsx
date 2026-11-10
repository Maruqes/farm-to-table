import { Link } from 'react-router-dom'
import { Apple, Carrot, Flower2, Milk, Star, Wheat, Wine } from 'lucide-react'
import { formatMoney } from '@/services/format'
import { categoryLabel } from '../catalog-options'
import type { Product } from '../catalog.types'

function CategoryIcon({ category }: { category: string }) {
  const props = { className: 'size-10 text-primary/60', 'aria-hidden': true } as const
  switch (category) {
    case 'fruit':
      return <Apple {...props} />
    case 'honey':
      return <Flower2 {...props} />
    case 'wine':
      return <Wine {...props} />
    case 'cheese':
      return <Milk {...props} />
    case 'bakery':
      return <Wheat {...props} />
    default:
      return <Carrot {...props} />
  }
}

export function ProductCard({ product }: { product: Product }) {
  const productHref = `/products/${product.id}`

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <Link to={productHref} className="block">
        <div className="aspect-[4/3] bg-secondary">
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
          <h3 className="text-base font-semibold leading-snug">
            <Link to={productHref} className="hover:text-primary">
              {product.name}
            </Link>
          </h3>
          <data value={product.price} className="tabular shrink-0 text-base font-semibold">
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
