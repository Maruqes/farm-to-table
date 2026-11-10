import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/services/api'
import { catalogService } from './catalog.service'
import type { CatalogQuery, Product } from './catalog.types'

interface CatalogResult {
  products: Product[]
  loading: boolean
  error: string | null
  reload: () => void
}

interface CatalogSnapshot {
  key: string
  products: Product[]
  error: string | null
}

const LOAD_ERROR = 'The catalog could not be loaded. Check your connection and try again.'

export function useCatalog(query: CatalogQuery): CatalogResult {
  const { q, producer, category, location, season, organic, sort } = query
  const [attempt, setAttempt] = useState(0)
  const [snapshot, setSnapshot] = useState<CatalogSnapshot>({
    key: '',
    products: [],
    error: null,
  })

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        q: q ?? null,
        producer: producer ?? null,
        category: category ?? null,
        location: location ?? null,
        season: season ?? null,
        organic: organic ?? null,
        sort: sort ?? null,
        attempt,
      }),
    [q, producer, category, location, season, organic, sort, attempt],
  )

  useEffect(() => {
    let active = true

    catalogService
      .listProducts({ q, producer, category, location, season, organic, sort })
      .then((products) => {
        if (active) setSnapshot({ key: requestKey, products, error: null })
      })
      .catch((cause: unknown) => {
        if (!active) return
        setSnapshot({
          key: requestKey,
          products: [],
          error: cause instanceof ApiError ? cause.message : LOAD_ERROR,
        })
      })

    return () => {
      active = false
    }
  }, [requestKey, q, producer, category, location, season, organic, sort])

  const reload = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  return {
    products: snapshot.products,
    loading: snapshot.key !== requestKey,
    error: snapshot.key === requestKey ? snapshot.error : null,
    reload,
  }
}
