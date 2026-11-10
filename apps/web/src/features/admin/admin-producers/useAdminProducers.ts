import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/services/api'
import { adaptPendingProducers } from './admin-producers.adapter'
import { adminProducersService } from './admin-producers.service'
import type {
  PendingProducer,
  PendingProducerDecision,
  ProducerDecision,
  ProducerDecisionResult,
} from './admin-producers.types'

const LOAD_ERROR =
  'Pending producers could not be loaded. Check your connection and try again.'
const ACTION_ERROR =
  'The producer could not be updated. Check your connection and try again.'
const BUSY_MESSAGE =
  'Another decision is still saving. Please wait a moment.'

export function useAdminProducers() {
  const [producers, setProducers] = useState<PendingProducer[]>([])
  const [loadedKey, setLoadedKey] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<PendingProducerDecision | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const requestKey = `admin-producers|${attempt}`
  const loading = loadedKey !== requestKey

  useEffect(() => {
    let active = true

    adminProducersService
      .listPending()
      .then((dtos) => {
        if (!active) return
        setProducers(adaptPendingProducers(dtos))
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        setProducers([])
        setError(apiError?.message ?? LOAD_ERROR)
        setLoadedKey(requestKey)
      })

    return () => {
      active = false
    }
  }, [requestKey])

  const reload = useCallback(() => {
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  const decide = useCallback(
    async (
      producer: PendingProducer,
      action: ProducerDecision,
      reason?: string,
    ): Promise<ProducerDecisionResult> => {
      if (pending) {
        return { ok: false, message: BUSY_MESSAGE }
      }

      setPending({ id: producer.id, action })

      try {
        if (action === 'approve') {
          await adminProducersService.approve(producer.id)
          setAnnouncement(`${producer.name} was approved.`)
        } else {
          await adminProducersService.reject(producer.id, reason)
          setAnnouncement(`${producer.name} was rejected.`)
        }

        setProducers((current) =>
          current.filter((item) => item.id !== producer.id),
        )
        return { ok: true }
      } catch (cause) {
        return {
          ok: false,
          message: cause instanceof ApiError ? cause.message : ACTION_ERROR,
        }
      } finally {
        setPending(null)
      }
    },
    [pending],
  )

  return {
    producers,
    loading,
    error,
    empty: !loading && !error && producers.length === 0,
    pending,
    announcement,
    reload,
    decide,
  }
}
