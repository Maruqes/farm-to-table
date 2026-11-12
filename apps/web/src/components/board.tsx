import { cn } from '@/components/ui/utils'
import { crateClass } from './crate'

// Shared pieces of the painted price board (RULES.md). CSS lives in styles/globals.css.

export function CrateChip({ category, className }: { category: string | undefined; className?: string }) {
  return <span aria-hidden="true" className={cn('crate-chip', crateClass(category), className)} />
}
