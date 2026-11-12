import { Star } from 'lucide-react'
import { cn } from '@/components/ui/utils'

export function RatingStars({
  rating,
  className,
}: {
  rating: number
  className?: string
}) {
  const filled = Math.round(rating)
  return (
    <span className={cn('d-inline-flex align-items-center gap-1', className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          size={16}
          className={cn(
            'product-star',
            value <= filled ? 'is-filled' : 'is-empty',
          )}
        />
      ))}
    </span>
  )
}
