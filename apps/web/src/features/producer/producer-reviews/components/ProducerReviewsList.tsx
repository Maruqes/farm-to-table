import { Badge } from '@/components/ui/badge'
import { RatingStars } from '@/features/catalog/product-detail/components/RatingStars'
import { reviewSubject } from '../producer-reviews.labels'
import type { ProducerReview, ReportReviewResult } from '../producer-reviews.types'
import { ReportReviewDialog } from './ReportReviewDialog'

interface ReviewRowProps {
  review: ProducerReview
  reporting: boolean
  reportBusy: boolean
  onReport: (reviewId: string, reason: string) => Promise<ReportReviewResult>
}

function ReviewRow({ review, reporting, reportBusy, onReport }: ReviewRowProps) {
  return (
    <li className="board-row pa-review-row">
      <div className="min-w-0 vstack gap-1">
        <h2 className="text-break">{review.author}</h2>
        <p className="small text-body-secondary">{reviewSubject(review)}</p>
        {review.text ? (
          <p className="measure text-break small">{review.text}</p>
        ) : (
          <p className="small text-body-secondary">No comment left.</p>
        )}
      </div>

      <div className="d-flex align-items-center justify-content-between gap-2 pa-md-block">
        <span className="label-line pa-col-label">Rating</span>
        <div className="d-flex align-items-center gap-2">
          <RatingStars rating={review.rating} />
          <data
            value={review.rating}
            className="text-nowrap small fw-semibold tabular"
          >
            {review.rating > 0 ? review.rating.toFixed(1) : '—'}
          </data>
        </div>
      </div>

      <div className="d-flex align-items-center justify-content-between gap-2 pa-md-block">
        <span className="label-line pa-col-label">Status</span>
        <Badge variant={review.reported ? 'secondary' : 'outline'}>
          {review.reported ? 'Reported' : 'Published'}
        </Badge>
      </div>

      <div className="d-flex justify-content-md-end">
        {reporting ? (
          <p className="small text-body-secondary text-md-end">
            Waiting for an admin decision.
          </p>
        ) : (
          <ReportReviewDialog
            review={review}
            disabled={reportBusy}
            onReport={onReport}
          />
        )}
      </div>
    </li>
  )
}

interface ProducerReviewsListProps {
  reviews: ProducerReview[]
  reportingId: string | null
  onReport: (reviewId: string, reason: string) => Promise<ReportReviewResult>
}

export function ProducerReviewsList({
  reviews,
  reportingId,
  onReport,
}: ProducerReviewsListProps) {
  return (
    <div>
      <div
        aria-hidden="true"
        className="label-line d-none d-md-grid pa-review-head py-2"
      >
        <span>Review</span>
        <span>Rating</span>
        <span>Status</span>
        <span className="text-end">Action</span>
      </div>

      <ul
        aria-label="Reviews on your products and producer page"
        className="board"
      >
        {reviews.map((review) => (
          <ReviewRow
            key={review.id}
            review={review}
            reporting={review.reported}
            reportBusy={reportingId !== null}
            onReport={onReport}
          />
        ))}
      </ul>
    </div>
  )
}
