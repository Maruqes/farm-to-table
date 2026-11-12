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
      className="d-flex flex-column-reverse flex-md-row align-items-md-center justify-content-md-between gap-3"
    >
      <p className="small text-body-secondary text-center text-md-start mb-0">
        Page{' '}
        <data value={page} className="fw-semibold tabular">
          {page}
        </data>{' '}
        of{' '}
        <data
          value={pageCount}
          className="fw-semibold tabular"
        >
          {pageCount}
        </data>
      </p>

      <div className="admin-pagination-actions">
        <Button
          type="button"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          <ChevronLeft size={16} aria-hidden="true" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={page >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          Next
          <ChevronRight size={16} aria-hidden="true" />
        </Button>
      </div>
    </nav>
  )
}
