import { cn } from '@/components/ui/utils'
import { crateClass } from './crate'

// Shared pieces of the painted price board (RULES.md). CSS lives in styles/globals.css.

// With imageUrl the chip shows the product photo; the category colour stays as the fallback.
export function CrateChip({ category, imageUrl, className }: { category: string | undefined; imageUrl?: string; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('crate-chip', imageUrl && 'crate-chip-photo', crateClass(category), className)}>
      {imageUrl ? <img src={imageUrl} alt="" loading="lazy" onError={(e) => e.currentTarget.remove()} /> : null}
    </span>
  )
}
