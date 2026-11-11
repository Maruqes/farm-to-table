import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { ProducersDirectoryFilterDraft } from '../useProducersDirectoryFilters'

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

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
      className="rounded-xl border bg-card p-3"
    >
      <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(12rem,1fr)_auto] md:items-end">
        <div>
          <label htmlFor="producers-q" className="mb-1 block text-sm font-medium">
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
            className="h-10"
          />
        </div>

        <div>
          <label htmlFor="producers-location" className="mb-1 block text-sm font-medium">
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

        <div className="flex gap-2 md:justify-end">
          <Button type="submit" className="h-10 flex-1 md:flex-none">
            Apply
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 md:flex-none"
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
