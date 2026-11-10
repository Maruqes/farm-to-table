import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSession } from '@/context/session'
import { ApiError } from '@/services/api'
import { adaptProducerReview, adaptProducerReviews } from './producer-reviews.adapter'
import { summariseReviews } from './producer-reviews.labels'
import { producerReviewsService } from './producer-reviews.service'
import type { ProducerReview, ReportReviewResult } from './producer-reviews.types'

const LOAD_ERROR =
  'Your reviews could not be loaded. Check your connection and try again.'
const REPORT_ERROR =
  'The review could not be reported. Check your connection and try again.'

export function useProducerReviews() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const [reviews, setReviews] = useState<ProducerReview[]>([])
  const [loadedKey, setLoadedKey] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const requestKey = `reviews|${attempt}`
  const loading = loadedKey !== requestKey
  const summary = useMemo(() => summariseReviews(reviews), [reviews])

  useEffect(() => {
    if (!userId) return

    let active = true

    producerReviewsService
      .listMine()
      .then((dtos) => {
        if (!active) return
        setReviews(adaptProducerReviews(dtos))
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        setReviews([])
        setError(apiError?.message ?? LOAD_ERROR)
        setLoadedKey(requestKey)
      })

    return () => {
      active = false
    }
  }, [requestKey, userId])

  const reload = useCallback(() => {
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  const reportReview = useCallback(
    async (id: string, reason: string): Promise<ReportReviewResult> => {
      if (reportingId) {
        return {
          ok: false,
          message: 'Another report is still saving. Please wait a moment.',
        }
      }

      setReportingId(id)
      try {
        const dto = await producerReviewsService.report(id, reason)
        const adapted = adaptProducerReview(dto)
        const review = dto.id || dto._id ? adapted : { ...adapted, id }

        setReviews((current) =>
          current.map((item) => (item.id === id ? review : item)),
        )
        setAnnouncement(
          `Review by ${review.author} reported. An admin will check it.`,
        )
        return { ok: true, review }
      } catch (cause) {
        return {
          ok: false,
          message: cause instanceof ApiError ? cause.message : REPORT_ERROR,
        }
      } finally {
        setReportingId(null)
      }
    },
    [reportingId],
  )

  return {
    reviews,
    summary,
    loading,
    error,
    empty: !loading && !error && reviews.length === 0,
    reportingId,
    announcement,
    reload,
    reportReview,
  }
}
