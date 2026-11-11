import { CategoryIcon } from '@/features/catalog/home-catalog/components/CategoryIcon'
import { cn } from '@/components/ui/utils'

const TILE: Record<string, string> = {
  vegetables: 'bg-tile-veg',
  fruit: 'bg-tile-fruit',
  honey: 'bg-tile-honey',
  wine: 'bg-tile-wine',
  cheese: 'bg-tile-cheese',
  bakery: 'bg-tile-bakery',
}

// Produce tile stands in for a lot photo; the product name carries the meaning.
export function LotTile({ category, className }: { category: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center overflow-hidden rounded-xl border',
        TILE[category] ?? 'bg-tile-veg',
        className,
      )}
    >
      <CategoryIcon category={category} className="size-8 md:size-10" />
    </div>
  )
}
