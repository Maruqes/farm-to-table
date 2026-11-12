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
    <section aria-labelledby="reviews-title" className="border-t-2 border-ink pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="reviews-title">
          Reviews
        </h2>
        {reviews.length > 0 && (
          <p className="flex items-center gap-2 text-sm text-dim">
            <RatingStars rating={averageRating} />
            <span className="tabular font-semibold">
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
        <p className="mt-6 border border-dashed border-dim px-4 py-8 text-center text-sm text-dim">
          No reviews yet. After your first order you can tell other buyers what
          you thought.
        </p>
      ) : (
        <ul className="board mt-2">
          {reviews.map((review) => (
            <li key={review.id} className="board-row flex-wrap">
              <p className="font-semibold">{review.author}</p>
              <RatingStars rating={review.rating} />
              <span className="text-sm tabular">{review.rating.toFixed(1)}</span>
              <time
                dateTime={review.date}
                className="ml-auto text-sm text-dim"
              >
                {formatDate(review.date)}
              </time>
              {review.text && (
                <p className="w-full measure text-dim">
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
