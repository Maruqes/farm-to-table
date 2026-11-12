import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageStateProps {
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyMessage?: string
  errorMessage?: string
  onRetry?: () => void
  children?: ReactNode
}

export function PageState({
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'Nothing here yet.',
  errorMessage = 'We couldn’t load this. Check your connection and try again.',
  onRetry,
  children,
}: PageStateProps) {
  if (loading) {
    return (
      <div role="status" className="page-state">
        <Loader2 size={20} className="spin" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div role="alert" className="page-state is-error">
        <AlertTriangle size={24} className="text-danger" aria-hidden="true" />
        <p className="small mb-0">{errorMessage}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    )
  }

  if (empty) {
    return (
      <div className="page-state">
        <Inbox size={24} aria-hidden="true" />
        <p className="small mb-0">{emptyMessage}</p>
      </div>
    )
  }

  return <>{children}</>
}
