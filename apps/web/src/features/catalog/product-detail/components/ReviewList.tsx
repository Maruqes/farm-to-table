import { formatDate } from '@/services/format'
import type { Review } from '../product-detail.types'
import { RatingStars } from './RatingStars'

export function ReviewList({
  reviews,
  averageRating,
}: {
  reviews: Review[]
  averageRating: number
}) {
  return (
    <section aria-labelledby="reviews-title" className="border-t pt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reviews-title" className="text-2xl">
          Reviews
        </h2>
        {reviews.length > 0 && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <RatingStars rating={averageRating} />
            <span className="tabular font-medium text-foreground">
              {averageRating.toFixed(1)}
            </span>
            <span>
              out of 5 · {reviews.length}{' '}
              {reviews.length === 1 ? 'review' : 'reviews'}
            </span>
          </p>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          No reviews yet. After your first order you can tell other buyers what you
          thought.
        </p>
      ) : (
        <ul className="mt-2 list-none divide-y p-0">
          {reviews.map((review) => (
            <li key={review.id} className="py-5">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <p className="font-medium">{review.author}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RatingStars rating={review.rating} />
                  <span className="tabular">{review.rating.toFixed(1)}</span>
                  <time dateTime={review.date}>{formatDate(review.date)}</time>
                </div>
              </div>
              {review.text && (
                <p className="mt-1.5 max-w-[65ch] text-muted-foreground">
                  {review.text}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
