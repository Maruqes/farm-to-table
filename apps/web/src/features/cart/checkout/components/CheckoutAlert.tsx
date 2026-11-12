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
      className="frame-alarm d-flex align-items-start gap-2 px-4 py-3 small"
    >
      <AlertCircle
        size={16}
        className="flex-shrink-0 mt-1 text-danger"
        aria-hidden="true"
      />
      <div className="min-w-0 vstack gap-1">
        {title && <p className="fw-semibold mb-0">{title}</p>}
        <div className="text-body-secondary">{children}</div>
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  )
}
