import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORY_OPTIONS, SEASON_OPTIONS, SORT_OPTIONS } from '../catalog-options'
import type { CatalogSort } from '../catalog.types'
import type { CatalogFilterDraft } from '../useCatalogFilters'

const selectClassName =
  'h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

interface CatalogFiltersProps {
  initial: CatalogFilterDraft
  producer: string
  hasActiveFilters: boolean
  onApply: (draft: CatalogFilterDraft) => void
  onClear: () => void
  onClearProducer: () => void
}

export function CatalogFilters({
  initial,
  producer,
  hasActiveFilters,
  onApply,
  onClear,
  onClearProducer,
}: CatalogFiltersProps) {
  const [draft, setDraft] = useState<CatalogFilterDraft>(initial)

  function update<Key extends keyof CatalogFilterDraft>(key: Key, value: CatalogFilterDraft[Key]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply(draft)
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Catalog filters"
      className="rounded-xl border bg-card p-3"
    >
      <div className="grid grid-cols-2 items-end gap-x-2 gap-y-2 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))_auto_auto]">
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="catalog-q" className="mb-1 block text-xs font-medium text-muted-foreground">
            Search
          </label>
          <Input
            id="catalog-q"
            name="q"
            type="search"
            value={draft.q}
            onChange={(event) => update('q', event.target.value)}
            placeholder="Name, ingredient or producer"
            autoComplete="off"
            className="h-9"
          />
        </div>

        <div>
          <label htmlFor="catalog-location" className="mb-1 block text-xs font-medium text-muted-foreground">
            Locality
          </label>
          <Input
            id="catalog-location"
            name="location"
            type="text"
            value={draft.location}
            onChange={(event) => update('location', event.target.value)}
            placeholder="e.g. Minho"
            autoComplete="off"
            className="h-9"
          />
        </div>

        <div>
          <label htmlFor="catalog-category" className="mb-1 block text-xs font-medium text-muted-foreground">
            Category
          </label>
          <select
            id="catalog-category"
            name="category"
            className={selectClassName}
            value={draft.category}
            onChange={(event) => update('category', event.target.value)}
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="catalog-season" className="mb-1 block text-xs font-medium text-muted-foreground">
            Season
          </label>
          <select
            id="catalog-season"
            name="season"
            className={selectClassName}
            value={draft.season}
            onChange={(event) => update('season', event.target.value)}
          >
            <option value="">All seasons</option>
            {SEASON_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="catalog-sort" className="mb-1 block text-xs font-medium text-muted-foreground">
            Sort by
          </label>
          <select
            id="catalog-sort"
            name="sort"
            className={selectClassName}
            value={draft.sort}
            onChange={(event) => update('sort', event.target.value as CatalogSort | '')}
          >
            <option value="">Recommended</option>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <label htmlFor="catalog-organic" className="flex h-9 whitespace-nowrap cursor-pointer items-center gap-2 text-sm font-medium">
            <input
              id="catalog-organic"
              name="organic"
              type="checkbox"
              checked={draft.organic}
              onChange={(event) => update('organic', event.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            Organic only
          </label>
        </div>
        <div className="flex items-end gap-1">
          <Button type="submit" size="sm">
            Apply
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={!hasActiveFilters}>
            Clear
          </Button>
        </div>
      </div>

      {producer && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>
              Producer filter: <strong className="font-medium text-foreground">{producer}</strong>
            </span>
            <button
              type="button"
              onClick={onClearProducer}
              className="rounded-md px-1 font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            >
              Remove
            </button>
          </p>
        </div>
      )}
    </form>
  )
}
