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
    <li className="board-row grid gap-4 md:grid-cols-[minmax(0,1fr)_8rem_7.5rem_11rem] md:items-start">
      <div className="min-w-0 flex flex-col gap-1">
        <h2 className="break-words">{review.author}</h2>
        <p className="text-sm text-dim">{reviewSubject(review)}</p>
        {review.text ? (
          <p className="measure break-words text-sm">{review.text}</p>
        ) : (
          <p className="text-sm text-dim">No comment left.</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 md:block">
        <span className="label-line md:sr-only">Rating</span>
        <div className="flex items-center gap-2">
          <RatingStars rating={review.rating} />
          <data
            value={review.rating}
            className="text-nowrap text-sm font-semibold tabular"
          >
            {review.rating > 0 ? review.rating.toFixed(1) : '—'}
          </data>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 md:block">
        <span className="label-line md:sr-only">Status</span>
        <Badge variant={review.reported ? 'secondary' : 'outline'}>
          {review.reported ? 'Reported' : 'Published'}
        </Badge>
      </div>

      <div className="flex md:justify-end">
        {reporting ? (
          <p className="text-sm text-dim md:text-right">
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
        className="label-line hidden py-2 md:grid md:grid-cols-[minmax(0,1fr)_8rem_7.5rem_11rem] md:items-start"
      >
        <span>Review</span>
        <span>Rating</span>
        <span>Status</span>
        <span className="text-right">Action</span>
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
