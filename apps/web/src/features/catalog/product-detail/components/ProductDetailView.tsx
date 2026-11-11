import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatMoney } from '@/services/format'
import { CategoryIcon } from '../../home-catalog/components/CategoryIcon'
import { categoryLabel } from '../../home-catalog/catalog-options'
import type { ProductDetail } from '../product-detail.types'
import { QuantitySelector } from './QuantitySelector'
import { RatingStars } from './RatingStars'
import { ReviewList } from './ReviewList'

const TILE: Record<string, string> = {
  fruit: 'bg-tile-fruit',
  honey: 'bg-tile-honey',
  wine: 'bg-tile-wine',
  cheese: 'bg-tile-cheese',
  bakery: 'bg-tile-bakery',
}

interface ProductDetailViewProps {
  product: ProductDetail
  isAuthenticated: boolean
  onAddToCart: (product: ProductDetail, quantity: number) => void
}

export function ProductDetailView({
  product,
  isAuthenticated,
  onAddToCart,
}: ProductDetailViewProps) {
  const [quantity, setQuantity] = useState(1)
  const inStock = product.stock > 0

  return (
    <article className="space-y-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to catalog
      </Link>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        <div
          className={`aspect-square overflow-hidden rounded-xl border ${
            TILE[product.category] ?? 'bg-tile-veg'
          }`}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <CategoryIcon category={product.category} className="size-24" />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl">{product.name}</h1>
            <p className="text-muted-foreground">
              {product.producer.id ? (
                <Link
                  to={`/producers/${product.producer.id}`}
                  className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary"
                >
                  {product.producer.name}
                </Link>
              ) : (
                <span className="font-medium text-foreground">
                  {product.producer.name}
                </span>
              )}
              {product.producer.location ? ` · ${product.producer.location}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-baseline gap-2">
            <data
              value={product.price}
              className="font-display text-3xl font-extrabold tabular"
            >
              {formatMoney(product.price)}
            </data>
            <span className="text-sm text-muted-foreground">per {product.unit}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>{categoryLabel(product.category)}</span>
            {product.reviews.length > 0 && (
              <span className="flex items-center gap-2">
                <RatingStars rating={product.averageRating} />
                <span className="tabular font-medium text-foreground">
                  {product.averageRating.toFixed(1)}
                </span>
                <span>out of 5</span>
              </span>
            )}
          </div>

          {product.description && (
            <p className="max-w-[65ch] leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          {inStock ? (
            <p className="text-sm text-muted-foreground">
              In stock ·{' '}
              <data
                value={product.stock}
                className="tabular font-medium text-foreground"
              >
                {product.stock} {product.unit}
                {product.stock === 1 ? '' : 's'}
              </data>{' '}
              available
            </p>
          ) : (
            <Badge variant="secondary">Out of stock</Badge>
          )}

          <div className="space-y-4 border-t pt-5">
            {!inStock ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  This product is sold out for now. Check the catalog for what else
                  is in season.
                </p>
                <Button disabled className="w-full sm:w-auto">
                  Add to cart
                </Button>
              </div>
            ) : !isAuthenticated ? (
              <div className="space-y-2">
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/login">Log in to buy</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  You need an account to add products to your cart.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <QuantitySelector
                  value={quantity}
                  max={product.stock}
                  onChange={setQuantity}
                />
                <Button
                  type="button"
                  className="w-full sm:w-auto"
                  onClick={() => onAddToCart(product, quantity)}
                >
                  Add to cart
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReviewList
        reviews={product.reviews}
        averageRating={product.averageRating}
      />
    </article>
  )
}
