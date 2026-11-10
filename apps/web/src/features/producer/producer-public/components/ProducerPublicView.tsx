import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { PageState } from '@/components/PageState'
import { ProductGrid } from '@/features/catalog/home-catalog/components/ProductGrid'
import { RatingStars } from '@/features/catalog/product-detail/components/RatingStars'
import type { ProducerPublic } from '../producer-public.types'

const ProducerMap = lazy(() =>
  import('./ProducerMap').then((module) => ({ default: module.ProducerMap })),
)

export function ProducerPublicView({ producer }: { producer: ProducerPublic }) {
  const { lat, lng } = producer

  return (
    <article className="space-y-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to catalog
      </Link>

      <header className="space-y-4">
        <h1 className="text-3xl md:text-4xl">{producer.name}</h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          {producer.location && (
            <p className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" aria-hidden="true" />
              {producer.location}
            </p>
          )}
          {producer.averageRating > 0 ? (
            <p className="flex items-center gap-2">
              <RatingStars rating={producer.averageRating} />
              <span className="tabular font-medium text-foreground">
                {producer.averageRating.toFixed(1)}
              </span>
              <span className="text-muted-foreground">out of 5</span>
            </p>
          ) : (
            <p className="text-muted-foreground">No ratings yet</p>
          )}
        </div>

        {producer.bio && (
          <p className="max-w-[65ch] leading-relaxed text-muted-foreground">
            {producer.bio}
          </p>
        )}
      </header>

      {lat !== null && lng !== null && (
        <section aria-labelledby="producer-location-heading" className="space-y-3">
          <h2
            id="producer-location-heading"
            className="text-xl md:text-2xl"
          >
            Where to find them
          </h2>
          <Suspense
            fallback={
              <div
                role="status"
                className="h-64 w-full animate-pulse rounded-xl border bg-muted md:h-80"
              >
                <span className="sr-only">Loading map…</span>
              </div>
            }
          >
            <ProducerMap lat={lat} lng={lng} name={producer.name} />
          </Suspense>
        </section>
      )}

      <section aria-labelledby="producer-products-heading" className="space-y-4">
        <h2 id="producer-products-heading" className="text-xl md:text-2xl">
          Products
        </h2>
        {producer.products.length === 0 ? (
          <PageState
            empty
            emptyMessage={`${producer.name} has no products for sale right now. Browse the catalog to see what else is in season.`}
          />
        ) : (
          <ProductGrid products={producer.products} />
        )}
      </section>
    </article>
  )
}
