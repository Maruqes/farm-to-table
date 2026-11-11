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

const LIST_COLUMNS =
  'lg:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_7rem_auto]'

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
    <li
      className={`grid gap-4 p-4 lg:items-start lg:gap-5 ${LIST_COLUMNS} ${
        hidden ? 'bg-muted/30' : ''
      }`}
    >
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-base font-semibold break-words">
            {review.author}
          </h2>
          <span className="text-muted-foreground" aria-hidden="true">
            ·
          </span>
          <span className="flex items-center gap-2">
            <RatingStars rating={review.rating} />
            <data
              value={review.rating}
              className="text-sm font-medium tabular"
            >
              {review.rating > 0 ? review.rating.toFixed(1) : '—'}
            </data>
            <span className="sr-only">out of 5</span>
          </span>
        </div>

        <p className="text-sm text-muted-foreground">{reviewSubject(review)}</p>

        {review.text ? (
          <p className="max-w-[65ch] break-words text-sm">{review.text}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No comment left.</p>
        )}

        <p className="text-xs text-muted-foreground">
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

      <div className="space-y-1">
        <span className="text-sm text-muted-foreground lg:sr-only">
          Report reason
        </span>
        <p className="text-sm font-medium">{review.reportReason}</p>
        {review.reportNote && (
          <p className="text-sm text-muted-foreground">{review.reportNote}</p>
        )}
        {review.reportedAt && (
          <p className="text-xs text-muted-foreground">
            Reported{' '}
            <time dateTime={review.reportedAt}>
              {formatDate(review.reportedAt)}
            </time>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 lg:block">
        <span className="text-sm text-muted-foreground lg:sr-only">Status</span>
        <Badge variant={hidden ? 'secondary' : 'outline'}>
          {hidden && <EyeOff aria-hidden="true" />}
          {REVIEW_STATUS_LABELS[review.status]}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 lg:flex-nowrap lg:justify-end">
        {hidden ? (
          <p className="text-sm text-muted-foreground lg:max-w-28 lg:text-right">
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
        className={`hidden rounded-t-xl border border-b-0 bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground lg:grid lg:gap-5 ${LIST_COLUMNS}`}
      >
        <span>Review</span>
        <span>Report</span>
        <span>Status</span>
        <span className="text-right">Decision</span>
      </div>

      <ul
        aria-label="Reported reviews"
        className="divide-y rounded-xl border bg-card lg:rounded-t-none"
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
