import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ProducersDirectoryQuery } from './producers-directory.types'

export interface ProducersDirectoryFilterDraft {
  q: string
  location: string
}

export function useProducersDirectoryFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = useMemo<ProducersDirectoryQuery>(() => {
    const q = searchParams.get('q')?.trim() ?? ''
    const location = searchParams.get('location')?.trim() ?? ''
    return {
      ...(q ? { q } : {}),
      ...(location ? { location } : {}),
    }
  }, [searchParams])

  const draft = useMemo<ProducersDirectoryFilterDraft>(
    () => ({
      q: query.q ?? '',
      location: query.location ?? '',
    }),
    [query],
  )

  const hasActiveFilters = Boolean(query.q || query.location)

  const applyFilters = useCallback(
    (next: ProducersDirectoryFilterDraft) => {
      const params = new URLSearchParams()
      if (next.q.trim()) params.set('q', next.q.trim())
      if (next.location.trim()) params.set('location', next.location.trim())
      setSearchParams(params, { replace: true })
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  return {
    query,
    draft,
    hasActiveFilters,
    applyFilters,
    clearFilters,
  }
}
