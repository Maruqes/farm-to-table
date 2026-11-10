import { Button } from '@/components/ui/button'
import { PageState } from '@/components/PageState'
import { useCatalog } from '../useCatalog'
import { useCatalogFilters } from '../useCatalogFilters'
import { useLiveAuctions } from '../useLiveAuctions'
import { CatalogFilters } from './CatalogFilters'
import { LiveAuctionsStrip } from './LiveAuctionsStrip'
import { ProductGrid } from './ProductGrid'

export function HomeCatalog() {
  const { query, draft, hasActiveFilters, applyFilters, clearFilters, clearProducer } =
    useCatalogFilters()
  const { products, loading, error, reload } = useCatalog(query)
  const auctions = useLiveAuctions(3)

  const resultSummary = loading
    ? 'Loading products…'
    : error
      ? 'Products are unavailable right now.'
      : `${products.length} ${products.length === 1 ? 'product' : 'products'}${
          hasActiveFilters ? ' match your filters' : ' available'
        }`

  return (
    <div className="space-y-10 md:space-y-14">
      <section aria-labelledby="home-title" className="border-b pb-8 md:pb-12">
        <h1 id="home-title" className="max-w-3xl text-4xl font-semibold leading-[1.05] md:text-5xl">
          Local produce, straight from the farm
        </h1>
        <p className="mt-4 max-w-[60ch] text-lg text-muted-foreground">
          Buy fruit, vegetables, honey, wine, cheese and bread from nearby producers, or bid on a
          seasonal lot in a live auction.
        </p>
        <Button asChild size="lg" className="mt-6">
          <a href="#catalog">Browse the catalog</a>
        </Button>
      </section>

      <LiveAuctionsStrip auctions={auctions} />

      <section id="catalog" aria-labelledby="catalog-title" className="scroll-mt-24">
        <div>
          <h2 id="catalog-title" className="text-2xl font-semibold md:text-3xl">
            Browse the catalog
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{resultSummary}</p>
        </div>

        <div className="mt-5">
          <CatalogFilters
            key={`${draft.q}|${draft.location}|${draft.category}|${draft.season}|${draft.organic}|${draft.sort}`}
            initial={draft}
            producer={query.producer ?? ''}
            hasActiveFilters={hasActiveFilters}
            onApply={applyFilters}
            onClear={clearFilters}
            onClearProducer={clearProducer}
          />
        </div>

        <div className="mt-6">
          <PageState
            loading={loading}
            error={error}
            empty={products.length === 0}
            errorMessage={error ?? undefined}
            emptyMessage="No products match these filters. Try a different search or clear the filters."
            onRetry={reload}
          >
            <ProductGrid products={products} />
          </PageState>

          {!loading && !error && products.length === 0 && hasActiveFilters && (
            <div className="mt-4 flex justify-center">
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
