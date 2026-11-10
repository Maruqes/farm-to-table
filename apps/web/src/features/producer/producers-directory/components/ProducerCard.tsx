import { Link } from 'react-router-dom'
import { ArrowRight, Star } from 'lucide-react'
import type { ProducerDirectoryItem } from '../producers-directory.types'

export function ProducerCard({ producer }: { producer: ProducerDirectoryItem }) {
  const hasRating = producer.averageRating !== null && producer.averageRating > 0
  const productLabel = producer.productCount === 1 ? 'product' : 'products'

  return (
    <li className="h-full">
      <Link
        to={`/producers/${producer.id}`}
        className="group flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:border-foreground/30 sm:p-5"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 break-words text-lg leading-snug group-hover:text-primary">
            {producer.name}
          </h2>

          <span className="flex shrink-0 items-center gap-1 text-sm">
            {hasRating ? (
              <>
                <Star className="size-4 fill-current text-foreground" aria-hidden="true" />
                <data value={producer.averageRating ?? 0} className="tabular font-semibold">
                  {producer.averageRating?.toFixed(1)}
                </data>
                <span className="sr-only">out of 5</span>
              </>
            ) : (
              <span className="text-muted-foreground">No ratings yet</span>
            )}
          </span>
        </div>

        {producer.location && (
          <p className="mt-1 text-sm text-muted-foreground">{producer.location}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-6 text-sm">
          <span className="text-muted-foreground">
            {producer.productCount === 0 ? (
              'No products yet'
            ) : (
              <>
                <data value={producer.productCount} className="tabular font-medium text-foreground">
                  {producer.productCount}
                </data>{' '}
                {productLabel}
              </>
            )}
          </span>

          <span className="inline-flex items-center gap-1 font-medium text-primary">
            View producer
            <ArrowRight
              className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </div>
      </Link>
    </li>
  )
}
