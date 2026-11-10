import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/services/api'
import { producersDirectoryService } from './producers-directory.service'
import type {
  ProducerDirectoryItem,
  ProducersDirectoryQuery,
} from './producers-directory.types'

interface ProducersDirectoryResult {
  producers: ProducerDirectoryItem[]
  localities: string[]
  loading: boolean
  error: string | null
  reload: () => void
}

interface ProducersDirectorySnapshot {
  key: string
  producers: ProducerDirectoryItem[]
  localities: string[]
  error: string | null
}

const LOAD_ERROR =
  'The producer directory could not be loaded. Check your connection and try again.'

function collectLocalities(producers: ProducerDirectoryItem[]): string[] {
  const unique = new Set(producers.map((producer) => producer.location).filter(Boolean))
  return [...unique].sort((a, b) => a.localeCompare(b, 'en'))
}

export function useProducersDirectory(
  query: ProducersDirectoryQuery,
): ProducersDirectoryResult {
  const { q, location } = query
  const [attempt, setAttempt] = useState(0)
  const [snapshot, setSnapshot] = useState<ProducersDirectorySnapshot>({
    key: '',
    producers: [],
    localities: [],
    error: null,
  })

  const requestKey = useMemo(
    () =>
      JSON.stringify({
        q: q ?? null,
        location: location ?? null,
        attempt,
      }),
    [q, location, attempt],
  )

  useEffect(() => {
    let active = true

    Promise.all([
      producersDirectoryService.listProducers({ q, location }),
      producersDirectoryService.listProducers(),
    ])
      .then(([producers, allProducers]) => {
        if (!active) return
        setSnapshot({
          key: requestKey,
          producers,
          localities: collectLocalities(allProducers),
          error: null,
        })
      })
      .catch((cause: unknown) => {
        if (!active) return
        setSnapshot({
          key: requestKey,
          producers: [],
          localities: [],
          error: cause instanceof ApiError ? cause.message : LOAD_ERROR,
        })
      })

    return () => {
      active = false
    }
  }, [requestKey, q, location])

  const reload = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  const current = snapshot.key === requestKey

  return {
    producers: current ? snapshot.producers : [],
    localities: snapshot.localities,
    loading: !current,
    error: current ? snapshot.error : null,
    reload,
  }
}
