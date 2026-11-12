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
      className="frame-alarm flex items-start gap-2 px-6 py-4 text-sm"
    >
      <AlertCircle
        size={16}
        className="mt-1 shrink-0 text-alarm"
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col gap-1">
        {title && <p className="font-semibold">{title}</p>}
        <div className="text-dim">{children}</div>
        {action && <div className="pt-1">{action}</div>}
      </div>
    </div>
  )
}
