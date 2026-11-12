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
    <li className="grid gap-4 border-b border-dim py-[0.7rem] lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_7rem_auto] lg:items-start lg:gap-5">
      <div className="min-w-0 flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="break-words font-sans text-base font-semibold normal-case leading-[1.4]">
            {review.author}
          </h2>
          <span className="text-dim" aria-hidden="true">
            ·
          </span>
          <span className="flex items-center gap-2">
            <RatingStars rating={review.rating} />
            <data
              value={review.rating}
              className="text-sm font-semibold tabular"
            >
              {review.rating > 0 ? review.rating.toFixed(1) : '—'}
            </data>
            <span className="sr-only">out of 5</span>
          </span>
        </div>

        <p className="text-sm text-dim mb-0">{reviewSubject(review)}</p>

        {review.text ? (
          <p className="measure text-sm break-words mb-0">{review.text}</p>
        ) : (
          <p className="text-sm text-dim mb-0">No comment left.</p>
        )}

        <p className="text-sm text-dim mb-0">
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
        <span className="label-line lg:hidden">
          Report reason
        </span>
        <p className="text-sm font-semibold mb-0">{review.reportReason}</p>
        {review.reportNote && (
          <p className="text-sm text-dim break-words mb-0">{review.reportNote}</p>
        )}
        {review.reportedAt && (
          <p className="text-sm text-dim mb-0">
            Reported{' '}
            <time dateTime={review.reportedAt}>
              {formatDate(review.reportedAt)}
            </time>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 lg:block">
        <span className="label-line lg:hidden">Status</span>
        <Badge variant={hidden ? 'secondary' : 'outline'}>
          {hidden && <EyeOff size={16} aria-hidden="true" />}
          {REVIEW_STATUS_LABELS[review.status]}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 md:flex-nowrap md:justify-end">
        {hidden ? (
          <p className="text-sm text-dim lg:text-right mb-0">
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
        className="label-line hidden py-2 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_7rem_auto] lg:gap-5"
      >
        <span>Review</span>
        <span>Report</span>
        <span>Status</span>
        <span className="text-right">Decision</span>
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
