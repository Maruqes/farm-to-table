import { Button } from '@/components/ui/button'
import { PageState } from '@/components/PageState'
import { useCatalog } from '../useCatalog'
import { useCatalogFilters } from '../useCatalogFilters'
import { CatalogFilters } from './CatalogFilters'
import { ProductGrid } from './ProductGrid'

export function HomeCatalog() {
  const { query, draft, hasActiveFilters, applyFilters, clearFilters, clearProducer } =
    useCatalogFilters()
  const { products, loading, error, reload } = useCatalog(query)

  const resultSummary = loading
    ? 'Loading products…'
    : error
      ? 'Products are unavailable right now.'
      : `${products.length} ${products.length === 1 ? 'product' : 'products'}${
          hasActiveFilters ? ' match your filters' : ' available'
        }`

  return (
    <div className="space-y-6">
      <section id="catalog" aria-labelledby="catalog-title" className="scroll-mt-24">
        <div className="mb-4">
          <h1 id="catalog-title" className="text-xl md:text-2xl">
            Browse the catalog
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{resultSummary}</p>
        </div>
        <div>
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
