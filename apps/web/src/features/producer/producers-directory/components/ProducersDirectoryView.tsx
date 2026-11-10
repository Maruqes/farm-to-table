import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { useProducersDirectory } from '../useProducersDirectory'
import { useProducersDirectoryFilters } from '../useProducersDirectoryFilters'
import { ProducerDirectoryFilters } from './ProducerDirectoryFilters'
import { ProducerGrid } from './ProducerGrid'

export function ProducersDirectoryView() {
  const { query, draft, hasActiveFilters, applyFilters, clearFilters } =
    useProducersDirectoryFilters()
  const { producers, localities, loading, error, reload } =
    useProducersDirectory(query)

  const resultSummary = loading
    ? 'Loading producers…'
    : error
      ? 'Producers are unavailable right now.'
      : `${producers.length} ${producers.length === 1 ? 'producer' : 'producers'}${
          hasActiveFilters ? ' match your filters' : ' available'
        }`

  const noResults = !loading && !error && producers.length === 0

  return (
    <section aria-labelledby="producers-heading" className="space-y-6">
      <header className="space-y-1">
        <h1 id="producers-heading">Producers</h1>
        <p className="max-w-[65ch] text-muted-foreground">
          Meet the farms and makers behind the catalog. Search by name or narrow the
          list by locality.
        </p>
      </header>

      <ProducerDirectoryFilters
        key={`${draft.q}|${draft.location}`}
        initial={draft}
        localities={localities}
        hasActiveFilters={hasActiveFilters}
        onApply={applyFilters}
        onClear={clearFilters}
      />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {resultSummary}
      </p>

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        empty={noResults}
        emptyMessage={
          hasActiveFilters
            ? 'No producers match this search. Try a different name or locality, or clear the filters.'
            : 'There are no producers to show yet. Check back soon.'
        }
        onRetry={reload}
      >
        <ProducerGrid producers={producers} />
      </PageState>

      {noResults && hasActiveFilters && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      )}
    </section>
  )
}
