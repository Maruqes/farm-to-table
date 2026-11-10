import { Apple, Carrot, Flower2, Milk, Wheat, Wine } from 'lucide-react'
import { cn } from '@/components/ui/utils'

// One icon per product category; falls back to a vegetable.
export function CategoryIcon({ category, className }: { category: string; className?: string }) {
  const props = { className: cn('size-12 text-foreground/70', className), 'aria-hidden': true, strokeWidth: 1.5 } as const
  switch (category) {
    case 'fruit':
      return <Apple {...props} />
    case 'honey':
      return <Flower2 {...props} />
    case 'wine':
      return <Wine {...props} />
    case 'cheese':
      return <Milk {...props} />
    case 'bakery':
      return <Wheat {...props} />
    default:
      return <Carrot {...props} />
  }
}
