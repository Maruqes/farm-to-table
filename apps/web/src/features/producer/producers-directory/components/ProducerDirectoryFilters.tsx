import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProducersDirectoryFilterDraft } from '../useProducersDirectoryFilters'

const SELECT_CLASS =
  'block min-h-10 w-full border-2 border-ink bg-transparent px-3 py-1.5 text-[0.9375rem] text-ink'

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
      <div className="grid items-end gap-4 md:grid-cols-4">
        <div className="md:col-span-2">
          <label htmlFor="producers-q" className="label-line mb-1 block">
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

        <div>
          <label htmlFor="producers-location" className="label-line mb-1 block">
            Locality
          </label>
          <select
            id="producers-location"
            name="location"
            className={SELECT_CLASS}
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

        <div className="flex gap-2 md:justify-end">
          <Button type="submit" className="grow md:grow-0">
            Apply
          </Button>
          <Button
            type="button"
            variant="outline"
            className="grow md:grow-0"
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
