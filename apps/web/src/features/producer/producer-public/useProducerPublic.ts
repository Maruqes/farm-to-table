import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/services/api'
import { producerPublicService } from './producer-public.service'
import type { ProducerPublic } from './producer-public.types'

interface ProducerPublicResult {
  producer: ProducerPublic | null
  loading: boolean
  error: string | null
  notFound: boolean
  reload: () => void
}

interface ProducerPublicSnapshot {
  key: string
  producer: ProducerPublic | null
  error: string | null
  notFound: boolean
}

const LOAD_ERROR =
  'This producer page could not be loaded. Check your connection and try again.'

export function useProducerPublic(id: string): ProducerPublicResult {
  const [attempt, setAttempt] = useState(0)
  const [snapshot, setSnapshot] = useState<ProducerPublicSnapshot>({
    key: '',
    producer: null,
    error: null,
    notFound: false,
  })

  const requestKey = `${id}|${attempt}`

  useEffect(() => {
    let active = true

    producerPublicService
      .getProducer(id)
      .then((producer) => {
        if (active) {
          setSnapshot({ key: requestKey, producer, error: null, notFound: false })
        }
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        const notFound =
          apiError?.status === 404 ||
          apiError?.code === 'PRODUCER_NOT_FOUND' ||
          apiError?.code === 'PRODUCER_HIDDEN'
        setSnapshot({
          key: requestKey,
          producer: null,
          error: notFound ? null : (apiError?.message ?? LOAD_ERROR),
          notFound,
        })
      })

    return () => {
      active = false
    }
  }, [requestKey, id])

  const reload = useCallback(() => {
    setAttempt((value) => value + 1)
  }, [])

  const current = snapshot.key === requestKey

  return {
    producer: current ? snapshot.producer : null,
    loading: !current,
    error: current ? snapshot.error : null,
    notFound: current ? snapshot.notFound : false,
    reload,
  }
}
