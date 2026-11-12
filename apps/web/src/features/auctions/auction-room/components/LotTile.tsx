import { cn } from '@/components/ui/utils'
import { crateClass } from '@/components/crate'

// Flat crate-colour square standing in for a lot photo; the product name carries the meaning.
export function LotTile({ category }: { category: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('room-lot-tile frame-thick', crateClass(category))}
    />
  )
}
