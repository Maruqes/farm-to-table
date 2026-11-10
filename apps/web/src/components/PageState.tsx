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
      <div role="status" className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        <span>Loading…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-16 text-center"
      >
        <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
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
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-16 text-center">
        <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    )
  }

  return <>{children}</>
}
