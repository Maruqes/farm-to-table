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
          disabled={disabled}
          aria-label={`${rejecting ? 'Reject' : 'Approve'} ${producer.name}`}
        >
          {rejecting ? (
            <X size={16} aria-hidden="true" />
          ) : (
            <Check size={16} aria-hidden="true" />
          )}
          {rejecting ? 'Reject' : 'Approve'}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel">
          <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
            <div>
              <Dialog.Title>{copy.title(producer.name)}</Dialog.Title>
              <Dialog.Description className="small text-body-secondary mb-0">
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
                <X size={16} aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="vstack gap-3">
            {rejecting && (
              <div>
                <div className="d-flex align-items-baseline justify-content-between gap-3">
                  <label htmlFor={reasonId} className="form-label">
                    Reason (optional)
                  </label>
                  <span className="small text-body-secondary tabular">
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
                  className="form-control"
                />
              </div>
            )}

            <div className="d-flex flex-column-reverse flex-sm-row justify-content-sm-end gap-2">
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
                  <Loader2 size={16} className="spin" aria-hidden="true" />
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
