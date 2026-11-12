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
    <article className="vstack gap-4">
      <Link
        to="/"
        className="product-back-link small text-body-secondary"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to catalog
      </Link>

      <div className="product-heading">
        <p className="product-producer small fw-semibold text-uppercase">
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
        <h1 className="product-name">
          {product.name}
        </h1>
      </div>

      <div className="row g-4 align-items-start">
        <div className="col-md-6">
          <section
            aria-label={`${product.name} label`}
            className={cn(
              'crate-label product-label-single',
              crateClass(product.category),
            )}
          >
            <div className="product-media">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="product-photo"
                />
              ) : (
                <div
                  className="product-photo-fallback"
                  role="img"
                  aria-label={product.name}
                >
                  <CategoryIcon category={product.category} size={96} />
                </div>
              )}
            </div>

            <span className={cn('stamp product-stamp', crateClass(product.category))} aria-hidden="true">
              <span className="product-stamp-inner">
                <CategoryIcon category={product.category} size={22} />
                <span>{categoryLabel(product.category)}</span>
              </span>
            </span>
            <span className="price-tag product-price-tag">
              <data value={product.price}>{formatMoney(product.price)}</data>
            </span>

            <div className="double-rule pt-2 small fw-semibold text-uppercase product-origin">
              <span className="d-block text-truncate">
                {product.producer.location || categoryLabel(product.category)}
              </span>
            </div>
          </section>
        </div>

        <div className="col-md-6">
          <div className="vstack gap-4">
            <div>
              <p className="label-line">Description</p>
              {product.description ? (
                <p className="mt-2 measure">
                  {product.description}
                </p>
              ) : (
                <p className="mt-2 measure text-body-secondary">
                  No description from the producer yet.
                </p>
              )}
              <div className="mt-4 d-flex flex-wrap align-items-center gap-2 small text-body-secondary">
                <span>{categoryLabel(product.category)}</span>
                <span aria-hidden="true">·</span>
                <span>per {product.unit}</span>
                {product.reviews.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="d-flex align-items-center gap-2">
                      <RatingStars rating={product.averageRating} />
                      <span className="tabular fw-semibold">
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
                <p className="mt-2 small text-body-secondary">
                  In stock ·{' '}
                  <data
                    value={product.stock}
                    className="tabular fw-semibold"
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

              <div className="mt-4 rule pt-4">
                {!inStock ? (
                  <div className="vstack gap-3">
                    <p className="small text-body-secondary">
                      This product is sold out for now. Check the catalog for what
                      else is in season.
                    </p>
                    <div>
                      <Button disabled size="lg" className="product-buy-btn">
                        Add to cart
                      </Button>
                    </div>
                  </div>
                ) : !isAuthenticated ? (
                  <div className="vstack gap-3">
                    <div>
                      <Button asChild size="lg" className="product-buy-btn">
                        <Link to="/login">Log in to buy</Link>
                      </Button>
                    </div>
                    <p className="small text-body-secondary">
                      You need an account to add products to your cart.
                    </p>
                  </div>
                ) : (
                  <div className="vstack gap-3">
                    <QuantitySelector
                      value={quantity}
                      max={product.stock}
                      onChange={setQuantity}
                    />
                    <div>
                      <Button
                        type="button"
                        size="lg"
                        className="product-buy-btn"
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
