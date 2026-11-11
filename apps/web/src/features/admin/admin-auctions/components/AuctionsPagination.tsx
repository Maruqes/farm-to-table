import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AuctionsPaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

export function AuctionsPagination({
  page,
  pageCount,
  onChange,
}: AuctionsPaginationProps) {
  if (pageCount <= 1) return null

  return (
    <nav
      aria-label="Auctions pagination"
      className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-center text-sm text-muted-foreground sm:text-left">
        Page{' '}
        <data value={page} className="font-medium text-foreground tabular">
          {page}
        </data>{' '}
        of{' '}
        <data
          value={pageCount}
          className="font-medium text-foreground tabular"
        >
          {pageCount}
        </data>
      </p>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1 sm:flex-none"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 flex-1 sm:flex-none"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
