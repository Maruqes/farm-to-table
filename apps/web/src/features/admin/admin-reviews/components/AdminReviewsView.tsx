import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PageState } from '@/components/PageState'
import type {
  AdminReview,
  ReviewDecisionResult,
  ReviewModerationDecision,
} from '../admin-reviews.types'
import { useAdminReviews } from '../useAdminReviews'
import { ReportedReviewsList } from './ReportedReviewsList'

export function AdminReviewsView() {
  const {
    reviews,
    counts,
    loading,
    error,
    empty,
    pending,
    announcement,
    reload,
    decide,
  } = useAdminReviews()

  const handleDecision = useCallback(
    async (
      review: AdminReview,
      action: ReviewModerationDecision,
    ): Promise<ReviewDecisionResult> => {
      const result = await decide(review, action)

      if (result.ok) {
        toast.success(
          action === 'keep'
            ? `Review by ${review.author} was kept and left the queue.`
            : `Review by ${review.author} was hidden from buyers.`,
        )
      }

      return result
    },
    [decide],
  )

  return (
    <section aria-labelledby="admin-reviews-heading" className="vstack gap-4">
      <Link to="/admin" className="admin-back">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to admin overview
      </Link>

      <header>
        <h1 id="admin-reviews-heading">Reported reviews</h1>
        <p className="measure text-body-secondary mb-0">
          Reviews reported by producers or buyers land here. Keep one to dismiss
          the report, or hide it to remove it from the product and producer
          pages. Hidden reviews stay in the queue so the decision remains
          visible.
        </p>
      </header>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      {!loading && !error && reviews.length > 0 && (
        <p className="small text-body-secondary mb-0">
          <data
            value={counts.reported}
            className="fw-semibold tabular"
          >
            {counts.reported}
          </data>{' '}
          {counts.reported === 1 ? 'review is' : 'reviews are'} waiting for a
          decision
          {counts.hidden > 0 && (
            <>
              <span aria-hidden="true"> · </span>
              <data
                value={counts.hidden}
                className="fw-semibold tabular"
              >
                {counts.hidden}
              </data>{' '}
              hidden
            </>
          )}
        </p>
      )}

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
        empty={empty}
        emptyMessage="No reported reviews are waiting. When a producer or buyer reports a review, it appears here for a keep or hide decision."
      >
        <ReportedReviewsList
          reviews={reviews}
          pending={pending}
          onDecision={handleDecision}
        />
      </PageState>
    </section>
  )
}
