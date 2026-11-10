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
    <li className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_8rem_7.5rem_11rem] md:items-start md:gap-4">
      <div className="min-w-0 space-y-1">
        <h2 className="break-words text-base font-semibold">{review.author}</h2>
        <p className="text-sm text-muted-foreground">{reviewSubject(review)}</p>
        {review.text ? (
          <p className="max-w-[65ch] break-words text-sm">{review.text}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No comment left.</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 md:block">
        <span className="text-sm text-muted-foreground md:sr-only">Rating</span>
        <div className="flex items-center gap-2">
          <RatingStars rating={review.rating} />
          <data
            value={review.rating}
            className="whitespace-nowrap text-sm font-medium tabular"
          >
            {review.rating > 0 ? review.rating.toFixed(1) : '—'}
          </data>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 md:block">
        <span className="text-sm text-muted-foreground md:sr-only">Status</span>
        <Badge variant={review.reported ? 'secondary' : 'outline'}>
          {review.reported ? 'Reported' : 'Published'}
        </Badge>
      </div>

      <div className="flex md:justify-end">
        {reporting ? (
          <p className="text-sm text-muted-foreground md:text-right">
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
        className="hidden rounded-t-xl border border-b-0 bg-muted/40 px-4 py-2.5 text-sm font-medium text-muted-foreground md:grid md:grid-cols-[minmax(0,1fr)_8rem_7.5rem_11rem] md:gap-4"
      >
        <span>Review</span>
        <span>Rating</span>
        <span>Status</span>
        <span className="text-right">Action</span>
      </div>

      <ul
        aria-label="Reviews on your products and producer page"
        className="divide-y rounded-xl border bg-card md:rounded-t-none"
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
