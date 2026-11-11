import { useId, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { Check, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type {
  PendingProducer,
  ProducerDecision,
  ProducerDecisionResult,
} from '../admin-producers.types'

const REJECT_REASON_MAX_LENGTH = 300

interface DecisionCopy {
  title: (name: string) => string
  description: string
  confirm: string
  pending: string
}

const DECISION_COPY: Record<ProducerDecision, DecisionCopy> = {
  approve: {
    title: (name) => `Approve ${name}?`,
    description:
      'Approving lets this farm add products and start selling on Farm to Table.',
    confirm: 'Approve producer',
    pending: 'Approving…',
  },
  reject: {
    title: (name) => `Reject ${name}?`,
    description:
      'Rejecting closes this application, so the producer cannot sell on Farm to Table. A short reason is optional.',
    confirm: 'Reject producer',
    pending: 'Rejecting…',
  },
}

interface ProducerDecisionDialogProps {
  producer: PendingProducer
  action: ProducerDecision
  disabled?: boolean
  onDecision: (reason?: string) => Promise<ProducerDecisionResult>
}

export function ProducerDecisionDialog({
  producer,
  action,
  disabled = false,
  onDecision,
}: ProducerDecisionDialogProps) {
  const reasonId = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const copy = DECISION_COPY[action]
  const rejecting = action === 'reject'

  function handleOpenChange(next: boolean) {
    if (!next && submitting) return
    setOpen(next)
    if (next) {
      setReason('')
      setSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setSubmitting(true)
    try {
      const trimmedReason = reason.trim()
      const result = await onDecision(
        rejecting && trimmedReason ? trimmedReason : undefined,
      )
      if (result.ok) setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button
          type="button"
          variant={rejecting ? 'outline' : 'default'}
          size="sm"
          className="h-10 flex-1 px-3 sm:flex-none"
          disabled={disabled}
          aria-label={`${rejecting ? 'Reject' : 'Approve'} ${producer.name}`}
        >
          {rejecting ? (
            <X className="size-4" aria-hidden="true" />
          ) : (
            <Check className="size-4" aria-hidden="true" />
          )}
          {rejecting ? 'Reject' : 'Approve'}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 dark:bg-background/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-5 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl">
                {copy.title(producer.name)}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                {copy.description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Close ${rejecting ? 'rejection' : 'approval'} dialog`}
                disabled={submitting}
              >
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {rejecting && (
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor={reasonId} className="text-sm font-medium">
                    Reason{' '}
                    <span className="font-normal text-muted-foreground">
                      (optional)
                    </span>
                  </label>
                  <span className="text-xs text-muted-foreground tabular">
                    {reason.length} / {REJECT_REASON_MAX_LENGTH}
                  </span>
                </div>
                <textarea
                  id={reasonId}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={REJECT_REASON_MAX_LENGTH}
                  rows={3}
                  placeholder="Why is this application being rejected?"
                  className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={submitting}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                variant={rejecting ? 'destructive' : 'default'}
                disabled={submitting}
              >
                {submitting && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {submitting ? copy.pending : copy.confirm}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
