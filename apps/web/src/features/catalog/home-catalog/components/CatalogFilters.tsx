import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/components/ui/utils'
import { crateClass } from '@/components/crate'
import { CATEGORY_OPTIONS, SEASON_OPTIONS, SORT_OPTIONS } from '../catalog-options'
import type { CatalogSort } from '../catalog.types'
import type { CatalogFilterDraft } from '../useCatalogFilters'

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
        'catalog-chip',
        pressed && (crate ? crateClass(crate) : 'ink-fill'),
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
    <form onSubmit={handleSubmit} aria-label="Catalog filters" className="vstack gap-3">
      <fieldset>
        <legend className="label-line">Category</legend>
        <div className="d-flex flex-wrap gap-2">
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

      <div className="catalog-filter-grid">
        <div className="catalog-field-wide">
          <label htmlFor="catalog-q" className="form-label">
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
          <label htmlFor="catalog-location" className="form-label">
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
          <label htmlFor="catalog-season" className="form-label">
            Season
          </label>
          <select
            id="catalog-season"
            name="season"
            className="form-select"
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
          <label htmlFor="catalog-sort" className="form-label">
            Sort by
          </label>
          <select
            id="catalog-sort"
            name="sort"
            className="form-select"
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

        <div className="d-flex align-items-end">
          <div className="form-check catalog-check">
            <input
              id="catalog-organic"
              name="organic"
              type="checkbox"
              checked={draft.organic}
              onChange={(event) => update('organic', event.target.checked)}
              className="form-check-input"
            />
            <label htmlFor="catalog-organic" className="form-check-label">
              Organic only
            </label>
          </div>
        </div>
        <div className="d-flex align-items-end gap-1">
          <Button type="submit" size="sm">
            Apply
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClear} disabled={!hasActiveFilters}>
            Clear
          </Button>
        </div>
      </div>

      {producer && (
        <div className="d-flex flex-wrap align-items-center gap-2">
          <p className="d-flex align-items-center gap-2 small text-body-secondary">
            <span>
              Producer filter: <strong className="fw-semibold">{producer}</strong>
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
