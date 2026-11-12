import { AlertCircle } from 'lucide-react'

export function CartNotice({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="frame-alarm flex items-start gap-2 px-6 py-4 text-sm"
    >
      <AlertCircle
        size={16}
        className="mt-1 shrink-0 text-alarm"
        aria-hidden="true"
      />
      <p>{message}</p>
    </div>
  )
}
