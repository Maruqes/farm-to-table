import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/components/ui/utils'
import { crateClass } from '@/components/crate'
import { CATEGORY_OPTIONS, SEASON_OPTIONS, SORT_OPTIONS } from '../catalog-options'
import type { CatalogSort } from '../catalog.types'
import type { CatalogFilterDraft } from '../useCatalogFilters'

const SELECT_CLASS =
  'block min-h-10 w-full border-2 border-ink bg-transparent px-3 py-1.5 text-[0.9375rem] text-ink'

// Square category chip: filled with the crate colour when on, outlined when off.
function CategoryChip({
  pressed,
  onClick,
  children,
  crate,
}: {
  pressed: boolean
  onClick: () => void
  children: string
  crate?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-10 cursor-pointer items-center border-2 border-ink px-3 py-1 text-sm font-semibold capitalize transition-colors duration-150 ease-out',
        pressed
          ? (crate ? crateClass(crate) : 'bg-ink text-paper')
          : 'bg-transparent text-ink hover:bg-wash',
      )}
    >
      {children}
    </button>
  )
}

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
    <form onSubmit={handleSubmit} aria-label="Catalog filters" className="flex flex-col gap-4">
      <fieldset>
        <legend className="label-line">Category</legend>
        <div className="flex flex-wrap gap-2">
          <CategoryChip pressed={draft.category === ''} onClick={() => update('category', '')}>
            All
          </CategoryChip>
          {CATEGORY_OPTIONS.map((option) => (
            <CategoryChip
              key={option.value}
              crate={option.value}
              pressed={draft.category === option.value}
              onClick={() =>
                update('category', draft.category === option.value ? '' : option.value)
              }
            >
              {option.label}
            </CategoryChip>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 items-end gap-x-2 gap-y-3 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto_auto]">
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="catalog-q" className="label-line mb-1 block">
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
          />
        </div>

        <div>
          <label htmlFor="catalog-location" className="label-line mb-1 block">
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
          />
        </div>

        <div>
          <label htmlFor="catalog-season" className="label-line mb-1 block">
            Season
          </label>
          <select
            id="catalog-season"
            name="season"
            className={SELECT_CLASS}
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
          <label htmlFor="catalog-sort" className="label-line mb-1 block">
            Sort by
          </label>
          <select
            id="catalog-sort"
            name="sort"
            className={SELECT_CLASS}
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
          <div className="flex min-h-10 items-center gap-2 whitespace-nowrap">
            <input
              id="catalog-organic"
              name="organic"
              type="checkbox"
              checked={draft.organic}
              onChange={(event) => update('organic', event.target.checked)}
              className="size-5 flex-none accent-ink"
            />
            <label htmlFor="catalog-organic" className="cursor-pointer">
              Organic only
            </label>
          </div>
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
        <div className="flex flex-wrap items-center gap-2">
          <p className="flex items-center gap-2 text-sm text-dim">
            <span>
              Producer filter: <strong className="font-semibold">{producer}</strong>
            </span>
            <Button type="button" variant="link" size="sm" onClick={onClearProducer}>
              Remove
            </Button>
          </p>
        </div>
      )}
    </form>
  )
}
