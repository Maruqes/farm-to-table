import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface OrdersPaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

export function OrdersPagination({
  page,
  pageCount,
  onChange,
}: OrdersPaginationProps) {
  if (pageCount <= 1) return null

  return (
    <nav
      aria-label="Orders pagination"
      className="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between"
    >
      <p className="text-center text-sm text-dim md:text-left mb-0">
        Page{' '}
        <data value={page} className="font-semibold tabular">
          {page}
        </data>{' '}
        of{' '}
        <data
          value={pageCount}
          className="font-semibold tabular"
        >
          {pageCount}
        </data>
      </p>

      <div className="flex gap-2 [&>*]:flex-1 md:[&>*]:flex-none">
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
