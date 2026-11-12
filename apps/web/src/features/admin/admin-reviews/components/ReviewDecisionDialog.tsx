import { useId, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { Check, EyeOff, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RatingStars } from '@/features/catalog/product-detail/components/RatingStars'
import { reviewSubject } from '../admin-reviews.labels'
import type {
  AdminReview,
  ReviewDecisionResult,
  ReviewModerationDecision,
} from '../admin-reviews.types'

interface DecisionCopy {
  title: (author: string) => string
  description: string
  confirm: string
  pending: string
}

const DECISION_COPY: Record<ReviewModerationDecision, DecisionCopy> = {
  keep: {
    title: (author) => `Keep the review by ${author}?`,
    description:
      'Keeping dismisses the report. The review stays visible and leaves this queue.',
    confirm: 'Keep review',
    pending: 'Keeping…',
  },
  hide: {
    title: (author) => `Hide the review by ${author}?`,
    description:
      'Hiding removes the review from the product and producer pages. It stays in this queue marked Hidden so the decision is visible.',
    confirm: 'Hide review',
    pending: 'Hiding…',
  },
}

interface ReviewDecisionDialogProps {
  review: AdminReview
  action: ReviewModerationDecision
  disabled?: boolean
  onDecision: () => Promise<ReviewDecisionResult>
}

export function ReviewDecisionDialog({
  review,
  action,
  disabled = false,
  onDecision,
}: ReviewDecisionDialogProps) {
  const errorId = useId()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const copy = DECISION_COPY[action]
  const hiding = action === 'hide'

  function handleOpenChange(next: boolean) {
    if (!next && submitting) return
    setOpen(next)
    if (next) {
      setError(null)
      setSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    setError(null)
    setSubmitting(true)
    try {
      const result = await onDecision()
      if (result.ok) {
        setOpen(false)
        return
      }
      setError(result.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <Button
          type="button"
          variant={hiding ? 'outline' : 'default'}
          size="sm"
          disabled={disabled}
          aria-label={`${hiding ? 'Hide' : 'Keep'} the review by ${review.author}`}
        >
          {hiding ? (
            <EyeOff size={16} aria-hidden="true" />
          ) : (
            <Check size={16} aria-hidden="true" />
          )}
          {hiding ? 'Hide' : 'Keep'}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel">
          <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
            <div>
              <Dialog.Title>
                {copy.title(review.author)}
              </Dialog.Title>
              <Dialog.Description className="small text-body-secondary mb-0">
                {copy.description}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Close ${hiding ? 'hide' : 'keep'} dialog`}
                disabled={submitting}
              >
                <X size={16} aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <blockquote className="admin-quote vstack gap-1 mb-4">
            <p className="d-flex flex-wrap align-items-center column-gap-2 row-gap-1 small fw-semibold mb-0">
              {review.author}
              <RatingStars rating={review.rating} />
              <data value={review.rating} className="tabular">
                {review.rating > 0 ? review.rating.toFixed(1) : '—'}
              </data>
              <span className="visually-hidden">out of 5</span>
            </p>
            <p className="small text-body-secondary mb-0">{reviewSubject(review)}</p>
            {review.text && (
              <p className="admin-clamp-3 small text-break mb-0">{review.text}</p>
            )}
          </blockquote>

          <form onSubmit={handleSubmit} className="vstack gap-3">
            {error && (
              <p id={errorId} role="alert" className="admin-error mb-0">
                {error}
              </p>
            )}

            <div className="d-flex flex-column-reverse flex-sm-row justify-content-sm-end gap-2">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" disabled={submitting}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                variant={hiding ? 'destructive' : 'default'}
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
