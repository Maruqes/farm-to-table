import { AlertCircle } from 'lucide-react'

export function CartNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="frame-alarm d-flex align-items-start gap-2 px-4 py-3 small"
    >
      <AlertCircle
        size={16}
        className="flex-shrink-0 mt-1 text-danger"
        aria-hidden="true"
      />
      <p className="mb-0">{message}</p>
    </div>
  )
}
