import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { crateClass } from '@/components/crate'
import { cn } from '@/components/ui/utils'
import { formatMoney } from '@/services/format'
import { CategoryIcon } from '../../home-catalog/components/CategoryIcon'
import { categoryLabel } from '../../home-catalog/catalog-options'
import type { ProductDetail } from '../product-detail.types'
import { QuantitySelector } from './QuantitySelector'
import { RatingStars } from './RatingStars'
import { ReviewList } from './ReviewList'

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
    <article className="flex flex-col gap-6">
      <Link
        to="/"
        className="inline-flex min-h-10 items-center gap-1 text-sm text-dim underline"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to catalog
      </Link>

      <div className="max-w-[40rem]">
        <p className="text-sm font-semibold tracking-[0.04em] uppercase">
          {product.producer.id ? (
            <Link
              to={`/producers/${product.producer.id}`}
            >
              {product.producer.name}
            </Link>
          ) : (
            <span>{product.producer.name}</span>
          )}
        </p>
        <h1 className="mt-1 mb-0 text-[clamp(2rem,5vw,3rem)]">
          {product.name}
        </h1>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-2">
        <div>
          <section
            aria-label={`${product.name} label`}
            className={cn(
              'crate-label flex flex-col gap-4',
              crateClass(product.category),
            )}
          >
            <div className="min-w-0">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="aspect-[16/10] w-full border-2 border-ink object-cover"
                />
              ) : (
                <div
                  className="flex aspect-[16/10] w-full items-center justify-center border-2 border-ink bg-paper text-ink"
                  role="img"
                  aria-label={product.name}
                >
                  <CategoryIcon category={product.category} size={96} className="text-ink" />
                </div>
              )}
            </div>

            <span className={cn('stamp absolute top-7 right-7 size-20', crateClass(product.category))} aria-hidden="true">
              <span className="flex flex-col items-center gap-[0.15rem]">
                <CategoryIcon category={product.category} size={22} className="text-current" />
                <span>{categoryLabel(product.category)}</span>
              </span>
            </span>
            <span className="price-tag absolute -right-2 bottom-[4.25rem]">
              <data value={product.price}>{formatMoney(product.price)}</data>
            </span>

            <div className="double-rule pt-2 text-sm font-semibold tracking-[0.04em] uppercase">
              <span className="block truncate">
                {product.producer.location || categoryLabel(product.category)}
              </span>
            </div>
          </section>
        </div>

        <div>
          <div className="flex flex-col gap-6">
            <div>
              <p className="label-line">Description</p>
              {product.description ? (
                <p className="mt-2 measure">
                  {product.description}
                </p>
              ) : (
                <p className="mt-2 measure text-dim">
                  No description from the producer yet.
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-dim">
                <span>{categoryLabel(product.category)}</span>
                <span aria-hidden="true">·</span>
                <span>per {product.unit}</span>
                {product.reviews.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="flex items-center gap-2">
                      <RatingStars rating={product.averageRating} />
                      <span className="tabular font-semibold">
                        {product.averageRating.toFixed(1)}
                      </span>
                      <span>out of 5</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div>
              <p className="label-line">Availability</p>
              {inStock ? (
                <p className="mt-2 text-sm text-dim">
                  In stock ·{' '}
                  <data
                    value={product.stock}
                    className="tabular font-semibold"
                  >
                    {product.stock} {product.unit}
                    {product.stock === 1 ? '' : 's'}
                  </data>{' '}
                  available
                </p>
              ) : (
                <p className="mt-2">
                  <Badge variant="outline">Out of stock</Badge>
                </p>
              )}

              <div className="mt-6 border-t-2 border-ink pt-6">
                {!inStock ? (
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-dim">
                      This product is sold out for now. Check the catalog for what
                      else is in season.
                    </p>
                    <div>
                      <Button disabled size="lg" className="w-full sm:w-auto">
                        Add to cart
                      </Button>
                    </div>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <Button asChild size="lg" className="w-full sm:w-auto">
                        <Link to="/login">Log in to buy</Link>
                      </Button>
                    </div>
                    <p className="text-sm text-dim">
                      You need an account to add products to your cart.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <QuantitySelector
                      value={quantity}
                      max={product.stock}
                      onChange={setQuantity}
                    />
                    <div>
                      <Button
                        type="button"
                        size="lg"
                        className="w-full sm:w-auto"
                        onClick={() => onAddToCart(product, quantity)}
                      >
                        Add to cart
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
