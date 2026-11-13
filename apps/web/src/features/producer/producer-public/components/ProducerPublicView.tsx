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
      <CrateChip category={product.category} imageUrl={product.imageUrl} />
      <span className="lot tabular">{lotNumber(product.id)}</span>

      <div className="min-w-0 grow">
        <Link to={detailsUrl} className="break-words font-semibold no-underline hover:underline">
          {product.name}
        </Link>
        <small className="block text-dim">
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

      <span className="hidden shrink-0 items-center gap-1 text-sm text-dim md:inline-flex">
        {product.averageRating > 0 ? (
          <>
            <Star size={16} className="fill-current" aria-hidden="true" />
            <data value={product.averageRating} className="tabular font-semibold">
              {product.averageRating.toFixed(1)}
            </data>
            <span className="sr-only">out of 5</span>
          </>
        ) : (
          'No ratings yet'
        )}
      </span>

      <div className="shrink-0 text-right">
        <data value={product.price} className="price tabular">
          {formatMoney(product.price)}
        </data>
        <small className="block text-dim">per {product.unit}</small>
      </div>

      <Button asChild variant="outline" size="sm" className="shrink-0">
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
    <article className="flex flex-col gap-12">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-dim no-underline hover:text-ink"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to catalog
      </Link>

      <header className={cn('crate-label', crateClass(mainCategory(producer.products)))}>
        <p className="m-0 text-xs font-semibold tracking-[0.04em] uppercase">Producer</p>
        <h1 className="mt-1 mb-0 text-5xl md:text-6xl">{producer.name}</h1>
        <div className="double-rule mt-6 flex flex-wrap justify-between gap-2 pt-2 text-sm font-semibold uppercase">
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

      {producer.bio && <p className="measure mb-0 leading-[1.625]">{producer.bio}</p>}

      {lat !== null && lng !== null && (
        <section aria-labelledby="producer-location-heading" className="flex flex-col gap-4">
          <h2 id="producer-location-heading" className="mb-0 text-xl md:text-2xl">
            Where to find them
          </h2>
          <Suspense
            fallback={
              <div
                role="status"
                className="frame-thick relative h-64 w-full animate-pulse bg-wash md:h-80"
              >
                <span className="sr-only">Loading map…</span>
              </div>
            }
          >
            <ProducerMap lat={lat} lng={lng} name={producer.name} />
          </Suspense>
        </section>
      )}

      <section aria-labelledby="producer-products-heading" className="flex flex-col gap-6">
        <h2 id="producer-products-heading" className="mb-0 text-xl md:text-2xl">
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
