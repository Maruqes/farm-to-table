import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { isCatalogSort, isCategory, isSeason } from './catalog-options'
import type { CatalogQuery, CatalogSort } from './catalog.types'

export interface CatalogFilterDraft {
  q: string
  location: string
  category: string
  season: string
  organic: boolean
  sort: CatalogSort | ''
}

export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = useMemo<CatalogQuery>(() => {
    const q = searchParams.get('q')?.trim() ?? ''
    const producer = searchParams.get('producer')?.trim() ?? ''
    const category = searchParams.get('category')
    const location = searchParams.get('location')?.trim() ?? ''
    const season = searchParams.get('season')
    const sort = searchParams.get('sort')
    return {
      ...(q ? { q } : {}),
      ...(producer ? { producer } : {}),
      ...(isCategory(category) ? { category } : {}),
      ...(location ? { location } : {}),
      ...(isSeason(season) ? { season } : {}),
      ...(searchParams.get('organic') === 'true' ? { organic: true } : {}),
      ...(isCatalogSort(sort) ? { sort } : {}),
    }
  }, [searchParams])

  const draft = useMemo<CatalogFilterDraft>(
    () => ({
      q: query.q ?? '',
      location: query.location ?? '',
      category: query.category ?? '',
      season: query.season ?? '',
      organic: query.organic === true,
      sort: query.sort ?? '',
    }),
    [query],
  )

  const hasActiveFilters = Boolean(
    query.q ||
      query.producer ||
      query.category ||
      query.location ||
      query.season ||
      query.organic ||
      query.sort,
  )

  const applyFilters = useCallback(
    (next: CatalogFilterDraft) => {
      const params = new URLSearchParams()
      if (query.producer) params.set('producer', query.producer)
      if (next.q.trim()) params.set('q', next.q.trim())
      if (next.location.trim()) params.set('location', next.location.trim())
      if (next.category) params.set('category', next.category)
      if (next.season) params.set('season', next.season)
      if (next.organic) params.set('organic', 'true')
      if (next.sort) params.set('sort', next.sort)
      setSearchParams(params, { replace: true })
    },
    [query.producer, setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams(), { replace: true })
  }, [setSearchParams])

  const clearProducer = useCallback(() => {
    const params = new URLSearchParams(searchParams)
    params.delete('producer')
    setSearchParams(params, { replace: true })
  }, [searchParams, setSearchParams])

  return {
    query,
    draft,
    hasActiveFilters,
    applyFilters,
    clearFilters,
    clearProducer,
  }
}
