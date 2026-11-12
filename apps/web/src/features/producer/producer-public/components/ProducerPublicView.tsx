import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { PageState } from '@/components/PageState'
import { CrateChip } from '@/components/board'
import { crateClass, lotNumber } from '@/components/crate'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/utils'
import { formatMoney } from '@/services/format'
import type { ProducerProduct, ProducerPublic } from '../producer-public.types'

const ProducerMap = lazy(() =>
  import('./ProducerMap').then((module) => ({ default: module.ProducerMap })),
)

/** Crate colour of the producer: the category they sell most, else the veg tile. */
function mainCategory(products: ProducerProduct[]): string | undefined {
  const counts = new Map<string, number>()
  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1)
  }
  let top: string | undefined
  let topCount = 0
  for (const [category, count] of counts) {
    if (count > topCount) {
      top = category
      topCount = count
    }
  }
  return top
}

function ProducerProductRow({ product }: { product: ProducerProduct }) {
  const detailsUrl = `/products/${product.id}`

  return (
    <li className="board-row flex-wrap">
      <CrateChip category={product.category} />
      <span className="lot tabular">{lotNumber(product.id)}</span>

      <div className="min-w-0 flex-grow-1">
        <Link to={detailsUrl} className="producer-public-product-link text-break fw-semibold">
          {product.name}
        </Link>
        <small className="d-block text-body-secondary">
          {product.stock > 0 ? (
            <>
              <data value={product.stock} className="tabular">
                {product.stock}
              </data>{' '}
              in stock
            </>
          ) : (
            'Out of stock'
          )}
        </small>
      </div>

      <span className="d-none d-md-inline-flex flex-shrink-0 align-items-center gap-1 small text-body-secondary">
        {product.averageRating > 0 ? (
          <>
            <Star size={16} className="producer-public-star" aria-hidden="true" />
            <data value={product.averageRating} className="tabular fw-semibold">
              {product.averageRating.toFixed(1)}
            </data>
            <span className="visually-hidden">out of 5</span>
          </>
        ) : (
          'No ratings yet'
        )}
      </span>

      <div className="flex-shrink-0 text-end">
        <data value={product.price} className="price tabular">
          {formatMoney(product.price)}
        </data>
        <small className="d-block text-body-secondary">per {product.unit}</small>
      </div>

      <Button asChild variant="outline" size="sm" className="flex-shrink-0">
        <Link to={detailsUrl} aria-label={`View ${product.name}`}>
          View
        </Link>
      </Button>
    </li>
  )
}

export function ProducerPublicView({ producer }: { producer: ProducerPublic }) {
  const { lat, lng } = producer

  return (
    <article className="vstack gap-5">
      <Link
        to="/"
        className="producer-public-back d-inline-flex align-items-center gap-1 small text-body-secondary"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to catalog
      </Link>

      <header className={cn('crate-label', crateClass(mainCategory(producer.products)))}>
        <p className="producer-public-kicker">Producer</p>
        <h1 className="producer-public-title mt-1 mb-0">{producer.name}</h1>
        <div className="double-rule mt-4 d-flex flex-wrap justify-content-between gap-2 pt-2 small fw-semibold text-uppercase">
          <span>{producer.location}</span>
          {producer.averageRating > 0 ? (
            <span>
              <data value={producer.averageRating} className="tabular">
                {producer.averageRating.toFixed(1)}
              </data>{' '}
              out of 5
            </span>
          ) : (
            <span>No ratings yet</span>
          )}
        </div>
      </header>

      {producer.bio && <p className="measure producer-public-bio mb-0">{producer.bio}</p>}

      {lat !== null && lng !== null && (
        <section aria-labelledby="producer-location-heading" className="vstack gap-3">
          <h2 id="producer-location-heading" className="producer-public-section-title mb-0">
            Where to find them
          </h2>
          <Suspense
            fallback={
              <div
                role="status"
                className="frame-thick w-100 producer-public-map placeholder-glow"
              >
                <span className="placeholder producer-public-map-placeholder">
                  <span className="visually-hidden">Loading map…</span>
                </span>
              </div>
            }
          >
            <ProducerMap lat={lat} lng={lng} name={producer.name} />
          </Suspense>
        </section>
      )}

      <section aria-labelledby="producer-products-heading" className="vstack gap-4">
        <h2 id="producer-products-heading" className="producer-public-section-title mb-0">
          Products
        </h2>
        {producer.products.length === 0 ? (
          <PageState
            empty
            emptyMessage={`${producer.name} has no products for sale right now. Browse the catalog to see what else is in season.`}
          />
        ) : (
          <ul role="list" className="board">
            {producer.products.map((product) => (
              <ProducerProductRow key={product.id} product={product} />
            ))}
          </ul>
        )}
      </section>
    </article>
  )
}
