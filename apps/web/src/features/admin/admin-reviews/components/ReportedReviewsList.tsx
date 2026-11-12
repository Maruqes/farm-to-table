import { EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { RatingStars } from '@/features/catalog/product-detail/components/RatingStars'
import { formatDate } from '@/services/format'
import {
  REVIEW_STATUS_LABELS,
  reviewSubject,
} from '../admin-reviews.labels'
import type {
  AdminReview,
  AdminReviewDecision,
  ReviewDecisionResult,
  ReviewModerationDecision,
} from '../admin-reviews.types'
import { ReviewDecisionDialog } from './ReviewDecisionDialog'

interface ReviewRowProps {
  review: AdminReview
  pending: AdminReviewDecision | null
  onDecision: (
    review: AdminReview,
    action: ReviewModerationDecision,
  ) => Promise<ReviewDecisionResult>
}

function ReviewRow({ review, pending, onDecision }: ReviewRowProps) {
  const hidden = review.status === 'hidden'
  const busy = pending !== null

  return (
    <li className="admin-review-row">
      <div className="min-w-0 vstack gap-2">
        <div className="d-flex flex-wrap align-items-center column-gap-2 row-gap-1">
          <h2 className="text-break">
            {review.author}
          </h2>
          <span className="text-body-secondary" aria-hidden="true">
            ·
          </span>
          <span className="d-flex align-items-center gap-2">
            <RatingStars rating={review.rating} />
            <data
              value={review.rating}
              className="small fw-semibold tabular"
            >
              {review.rating > 0 ? review.rating.toFixed(1) : '—'}
            </data>
            <span className="visually-hidden">out of 5</span>
          </span>
        </div>

        <p className="small text-body-secondary mb-0">{reviewSubject(review)}</p>

        {review.text ? (
          <p className="measure small text-break mb-0">{review.text}</p>
        ) : (
          <p className="small text-body-secondary mb-0">No comment left.</p>
        )}

        <p className="small text-body-secondary mb-0">
          Reviewed{' '}
          {review.createdAt ? (
            <time dateTime={review.createdAt}>
              {formatDate(review.createdAt)}
            </time>
          ) : (
            '—'
          )}
        </p>
      </div>

      <div>
        <span className="label-line d-lg-none">
          Report reason
        </span>
        <p className="small fw-semibold mb-0">{review.reportReason}</p>
        {review.reportNote && (
          <p className="small text-body-secondary text-break mb-0">{review.reportNote}</p>
        )}
        {review.reportedAt && (
          <p className="small text-body-secondary mb-0">
            Reported{' '}
            <time dateTime={review.reportedAt}>
              {formatDate(review.reportedAt)}
            </time>
          </p>
        )}
      </div>

      <div className="d-flex align-items-center justify-content-between gap-3 d-lg-block">
        <span className="label-line d-lg-none">Status</span>
        <Badge variant={hidden ? 'secondary' : 'outline'}>
          {hidden && <EyeOff size={16} aria-hidden="true" />}
          {REVIEW_STATUS_LABELS[review.status]}
        </Badge>
      </div>

      <div className="admin-decision-actions">
        {hidden ? (
          <p className="small text-body-secondary text-lg-end mb-0">
            Hidden from buyers
          </p>
        ) : (
          <>
            <ReviewDecisionDialog
              review={review}
              action="keep"
              disabled={busy}
              onDecision={() => onDecision(review, 'keep')}
            />
            <ReviewDecisionDialog
              review={review}
              action="hide"
              disabled={busy}
              onDecision={() => onDecision(review, 'hide')}
            />
          </>
        )}
      </div>
    </li>
  )
}

interface ReportedReviewsListProps {
  reviews: AdminReview[]
  pending: AdminReviewDecision | null
  onDecision: (
    review: AdminReview,
    action: ReviewModerationDecision,
  ) => Promise<ReviewDecisionResult>
}

export function ReportedReviewsList({
  reviews,
  pending,
  onDecision,
}: ReportedReviewsListProps) {
  return (
    <div>
      <div
        aria-hidden="true"
        className="admin-cols admin-review-cols label-line"
      >
        <span>Review</span>
        <span>Report</span>
        <span>Status</span>
        <span className="text-end">Decision</span>
      </div>

      <ul
        aria-label="Reported reviews"
        className="board"
      >
        {reviews.map((review) => (
          <ReviewRow
            key={review.id}
            review={review}
            pending={pending}
            onDecision={onDecision}
          />
        ))}
      </ul>
    </div>
  )
}
