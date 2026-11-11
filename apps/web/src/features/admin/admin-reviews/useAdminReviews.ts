import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/services/api'
import { adaptAdminReview, adaptAdminReviews } from './admin-reviews.adapter'
import { adminReviewsService } from './admin-reviews.service'
import type {
  AdminReview,
  AdminReviewDecision,
  ReviewDecisionResult,
  ReviewModerationDecision,
} from './admin-reviews.types'

const LOAD_ERROR =
  'Reported reviews could not be loaded. Check your connection and try again.'
const ACTION_ERROR =
  'The review could not be updated. Check your connection and try again.'
const BUSY_MESSAGE = 'Another decision is still saving. Please wait a moment.'

export function useAdminReviews() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loadedKey, setLoadedKey] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<AdminReviewDecision | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const requestKey = `admin-reviews|${attempt}`
  const loading = loadedKey !== requestKey

  const counts = useMemo(() => {
    const reported = reviews.filter(
      (review) => review.status === 'reported',
    ).length
    return { reported, hidden: reviews.length - reported }
  }, [reviews])

  useEffect(() => {
    let active = true

    adminReviewsService
      .listReported()
      .then((dtos) => {
        if (!active) return
        setReviews(adaptAdminReviews(dtos))
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
  }, [requestKey])

  const reload = useCallback(() => {
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  const decide = useCallback(
    async (
      review: AdminReview,
      action: ReviewModerationDecision,
    ): Promise<ReviewDecisionResult> => {
      if (pending) {
        return { ok: false, message: BUSY_MESSAGE }
      }

      setPending({ id: review.id, action })

      try {
        if (action === 'keep') {
          await adminReviewsService.keep(review.id)
          setReviews((current) =>
            current.filter((item) => item.id !== review.id),
          )
          setAnnouncement(`Review by ${review.author} was kept.`)
          return { ok: true, review }
        }

        const dto = await adminReviewsService.hide(review.id)
        const adapted = adaptAdminReview(dto)
        const hidden: AdminReview = {
          ...adapted,
          id: review.id,
          status: 'hidden',
        }

        setReviews((current) =>
          current.map((item) => (item.id === review.id ? hidden : item)),
        )
        setAnnouncement(`Review by ${review.author} was hidden from buyers.`)
        return { ok: true, review: hidden }
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
    reviews,
    counts,
    loading,
    error,
    empty: !loading && !error && reviews.length === 0,
    pending,
    announcement,
    reload,
    decide,
  }
}
