import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProducersDirectoryFilterDraft } from '../useProducersDirectoryFilters'

const selectClassName = 'form-select'

interface ProducerDirectoryFiltersProps {
  initial: ProducersDirectoryFilterDraft
  localities: string[]
  hasActiveFilters: boolean
  onApply: (draft: ProducersDirectoryFilterDraft) => void
  onClear: () => void
}

export function ProducerDirectoryFilters({
  initial,
  localities,
  hasActiveFilters,
  onApply,
  onClear,
}: ProducerDirectoryFiltersProps) {
  const [draft, setDraft] = useState<ProducersDirectoryFilterDraft>(initial)

  const canClear = hasActiveFilters || draft.q.trim() !== '' || draft.location !== ''
  const localityOptions =
    draft.location && !localities.includes(draft.location)
      ? [draft.location, ...localities]
      : localities

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply(draft)
  }

  function handleClear() {
    setDraft({ q: '', location: '' })
    onClear()
  }

  return (
    <form
      role="search"
      aria-label="Search and filter producers"
      onSubmit={handleSubmit}
    >
      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-6">
          <label htmlFor="producers-q" className="label-line form-label d-block">
            Search producers
          </label>
          <Input
            id="producers-q"
            name="q"
            type="search"
            value={draft.q}
            onChange={(event) =>
              setDraft((current) => ({ ...current, q: event.target.value }))
            }
            placeholder="Name"
            autoComplete="off"
          />
        </div>

        <div className="col-12 col-md-3">
          <label htmlFor="producers-location" className="label-line form-label d-block">
            Locality
          </label>
          <select
            id="producers-location"
            name="location"
            className={selectClassName}
            value={draft.location}
            onChange={(event) =>
              setDraft((current) => ({ ...current, location: event.target.value }))
            }
          >
            <option value="">All localities</option>
            {localityOptions.map((locality) => (
              <option key={locality} value={locality}>
                {locality}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-md-3 d-flex gap-2 justify-content-md-end">
          <Button type="submit" className="flex-grow-1 flex-md-grow-0">
            Apply
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-grow-1 flex-md-grow-0"
            onClick={handleClear}
            disabled={!canClear}
          >
            Clear
          </Button>
        </div>
      </div>
    </form>
  )
}
