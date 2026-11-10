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
          className="h-10 flex-1 px-3 sm:flex-none"
          disabled={disabled}
          aria-label={`${hiding ? 'Hide' : 'Keep'} the review by ${review.author}`}
        >
          {hiding ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Check className="size-4" aria-hidden="true" />
          )}
          {hiding ? 'Hide' : 'Keep'}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 dark:bg-background/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-5 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl">
                {copy.title(review.author)}
              </Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
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
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <blockquote className="mb-5 space-y-1 rounded-lg bg-muted/50 px-3 py-2.5">
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
              {review.author}
              <RatingStars rating={review.rating} />
              <data value={review.rating} className="tabular">
                {review.rating > 0 ? review.rating.toFixed(1) : '—'}
              </data>
              <span className="sr-only">out of 5</span>
            </p>
            <p className="text-sm text-muted-foreground">{reviewSubject(review)}</p>
            {review.text && (
              <p className="line-clamp-3 text-sm">{review.text}</p>
            )}
          </blockquote>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <p
                id={errorId}
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
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
