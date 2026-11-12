import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ProducerDirectoryItem } from '../producers-directory.types'

export function ProducerCard({ producer }: { producer: ProducerDirectoryItem }) {
  const hasRating = producer.averageRating !== null && producer.averageRating > 0
  const productLabel = producer.productCount === 1 ? 'product' : 'products'
  const detailsUrl = `/producers/${producer.id}`

  return (
    <li className="board-row flex-wrap">
      <div className="min-w-0 flex-grow-1">
        <h2 className="text-break">
          <Link to={detailsUrl} className="producers-row-link">
            {producer.name}
          </Link>
        </h2>
        {producer.location && (
          <p className="text-break mt-1 small text-body-secondary">
            {producer.location}
          </p>
        )}
      </div>

      <span className="d-none d-md-inline-flex flex-shrink-0 align-items-center gap-1 small">
        {hasRating ? (
          <>
            <Star size={16} className="producers-star" aria-hidden="true" />
            <data value={producer.averageRating ?? 0} className="tabular fw-semibold">
              {producer.averageRating?.toFixed(1)}
            </data>
            <span className="visually-hidden">out of 5</span>
          </>
        ) : (
          <span className="text-body-secondary">No ratings yet</span>
        )}
      </span>

      <span className="d-none d-md-block flex-shrink-0 small text-body-secondary">
        {producer.productCount === 0 ? (
          'No products yet'
        ) : (
          <>
            <data value={producer.productCount} className="tabular fw-medium">
              {producer.productCount}
            </data>{' '}
            {productLabel}
          </>
        )}
      </span>

      <Button asChild variant="outline" size="sm" className="flex-shrink-0">
        <Link to={detailsUrl} aria-label={`View ${producer.name}`}>
          View
        </Link>
      </Button>
    </li>
  )
}
