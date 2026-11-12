import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { PageState } from '@/components/PageState'
import { RatingStars } from '@/features/catalog/product-detail/components/RatingStars'
import type { ReportReviewResult } from '../producer-reviews.types'
import { useProducerReviews } from '../useProducerReviews'
import { ProducerReviewsList } from './ProducerReviewsList'

export function ProducerReviewsView() {
  const {
    reviews,
    summary,
    loading,
    error,
    empty,
    reportingId,
    announcement,
    reload,
    reportReview,
  } = useProducerReviews()

  const handleReport = useCallback(
    async (reviewId: string, reason: string): Promise<ReportReviewResult> => {
      const result = await reportReview(reviewId, reason)

      if (result.ok) {
        toast.success(
          `Review by ${result.review.author} reported. An admin will check it.`,
        )
      }

      return result
    },
    [reportReview],
  )

  return (
    <section aria-labelledby="producer-reviews-heading" className="vstack gap-4">
      <Link to="/producer" className="pa-back-link small text-body-secondary">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to dashboard
      </Link>

      <header className="vstack gap-3">
        <h1 id="producer-reviews-heading">Reviews</h1>
        <p className="measure text-body-secondary">
          Buyers rate your products and your public page after a delivered order. If a
          review breaks the rules, report it with a reason and an admin will decide
          whether to keep or hide it.
        </p>

        {!loading && !error && summary.count > 0 && (
          <p className="d-flex flex-wrap align-items-center gap-2 small text-body-secondary">
            <span className="d-flex align-items-center gap-2">
              <RatingStars rating={summary.average} />
              <data value={summary.average} className="fw-semibold tabular">
                {summary.average.toFixed(1)}
              </data>
              <span>out of 5</span>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <data value={summary.count} className="tabular">
                {summary.count}
              </data>{' '}
              {summary.count === 1 ? 'review' : 'reviews'}
            </span>
            {summary.reported > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  <data value={summary.reported} className="tabular">
                    {summary.reported}
                  </data>{' '}
                  reported
                </span>
              </>
            )}
          </p>
        )}
      </header>

      <p className="visually-hidden" aria-live="polite">
        {announcement}
      </p>

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
        empty={empty}
        emptyMessage="No reviews yet. When a buyer rates a delivered order, the review appears here so you can read it and report anything that breaks the rules."
      >
        <ProducerReviewsList
          reviews={reviews}
          reportingId={reportingId}
          onReport={handleReport}
        />
      </PageState>
    </section>
  )
}
