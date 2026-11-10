import type { ReactNode, RefObject } from 'react'
import { AlertCircle } from 'lucide-react'

interface CheckoutAlertProps {
  title?: string
  children: ReactNode
  action?: ReactNode
  containerRef?: RefObject<HTMLDivElement | null>
}

export function CheckoutAlert({
  title,
  children,
  action,
  containerRef,
}: CheckoutAlertProps) {
  return (
    <div
      ref={containerRef}
      role="alert"
      tabIndex={-1}
      className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm"
    >
      <AlertCircle
        className="mt-0.5 size-4 shrink-0 text-destructive"
        aria-hidden="true"
      />
      <div className="min-w-0 space-y-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-muted-foreground">{children}</div>
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  )
}
