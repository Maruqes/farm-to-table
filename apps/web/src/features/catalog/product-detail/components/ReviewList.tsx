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
    <section aria-labelledby="reviews-title" className="rule pt-4">
      <div className="d-flex flex-wrap align-items-baseline justify-content-between gap-2">
        <h2 id="reviews-title">
          Reviews
        </h2>
        {reviews.length > 0 && (
          <p className="d-flex align-items-center gap-2 small text-body-secondary">
            <RatingStars rating={averageRating} />
            <span className="tabular fw-semibold">
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
        <p className="product-reviews-empty mt-4 small text-body-secondary">
          No reviews yet. After your first order you can tell other buyers what
          you thought.
        </p>
      ) : (
        <ul className="board mt-2">
          {reviews.map((review) => (
            <li key={review.id} className="board-row flex-wrap">
              <p className="fw-semibold">{review.author}</p>
              <RatingStars rating={review.rating} />
              <span className="small tabular">{review.rating.toFixed(1)}</span>
              <time
                dateTime={review.date}
                className="ms-auto small text-body-secondary"
              >
                {formatDate(review.date)}
              </time>
              {review.text && (
                <p className="w-100 measure text-body-secondary">
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
