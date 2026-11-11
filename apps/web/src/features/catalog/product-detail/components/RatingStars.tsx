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
    <span className={cn('inline-flex items-center gap-0.5', className)} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            'size-4',
            value <= filled
              ? 'fill-current text-foreground'
              : 'text-muted-foreground/40',
          )}
        />
      ))}
    </span>
  )
}
