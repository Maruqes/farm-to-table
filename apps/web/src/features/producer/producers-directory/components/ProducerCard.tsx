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
      <div className="min-w-0 grow">
        <h2 className="break-words">
          <Link to={detailsUrl} className="no-underline hover:underline">
            {producer.name}
          </Link>
        </h2>
        {producer.location && (
          <p className="mt-1 break-words text-sm text-dim">
            {producer.location}
          </p>
        )}
      </div>

      <span className="hidden shrink-0 items-center gap-1 text-sm md:inline-flex">
        {hasRating ? (
          <>
            <Star size={16} className="fill-current" aria-hidden="true" />
            <data value={producer.averageRating ?? 0} className="tabular font-semibold">
              {producer.averageRating?.toFixed(1)}
            </data>
            <span className="sr-only">out of 5</span>
          </>
        ) : (
          <span className="text-dim">No ratings yet</span>
        )}
      </span>

      <span className="hidden shrink-0 text-sm text-dim md:block">
        {producer.productCount === 0 ? (
          'No products yet'
        ) : (
          <>
            <data value={producer.productCount} className="tabular font-medium">
              {producer.productCount}
            </data>{' '}
            {productLabel}
          </>
        )}
      </span>

      <Button asChild variant="outline" size="sm" className="shrink-0">
        <Link to={detailsUrl} aria-label={`View ${producer.name}`}>
          View
        </Link>
      </Button>
    </li>
  )
}
