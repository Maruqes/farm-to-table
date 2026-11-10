import { useId, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { Flag, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  REPORT_REASON_OPTIONS,
  type ReportReason,
} from '../producer-reviews.labels'
import type { ProducerReview, ReportReviewResult } from '../producer-reviews.types'

const NOTE_MAX_LENGTH = 200
const OTHER_NOTE_MIN_LENGTH = 10

interface ReportReviewDialogProps {
  review: ProducerReview
  disabled?: boolean
  onReport: (reviewId: string, reason: string) => Promise<ReportReviewResult>
}

export function ReportReviewDialog({
  review,
  disabled = false,
  onReport,
}: ReportReviewDialogProps) {
  const noteId = useId()
  const errorId = useId()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const subject = review.product ? `“${review.product}”` : 'your producer page'

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setReason('')
      setNote('')
      setError(null)
      setSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const trimmedNote = note.trim()

    if (!reason) {
      setError('Choose a reason for reporting this review.')
      return
    }

    const selected = REPORT_REASON_OPTIONS.find((option) => option.value === reason)
    if (!selected) {
      setError('Choose a reason for reporting this review.')
      return
    }

    if (selected.value === 'other' && trimmedNote.length < OTHER_NOTE_MIN_LENGTH) {
      setError(
        `Tell us what is wrong with this review (at least ${OTHER_NOTE_MIN_LENGTH} characters).`,
      )
      return
    }

    setError(null)
    setSubmitting(true)

    const reportReason = trimmedNote
      ? `${selected.label}: ${trimmedNote}`
      : selected.label

    try {
      const result = await onReport(review.id, reportReason)
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
          variant="outline"
          size="sm"
          className="h-10 px-3"
          disabled={disabled}
          aria-label={`Report the review by ${review.author}`}
        >
          <Flag className="size-4" aria-hidden="true" />
          Report
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 dark:bg-background/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-5 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl">Report this review</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Tell us why the review by {review.author} on {subject} should be
                checked. An admin decides whether to keep or hide it.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close report dialog">
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset className="space-y-2" aria-describedby={error ? errorId : undefined}>
              <legend className="text-sm font-medium">Reason</legend>
              <div className="space-y-2">
                {REPORT_REASON_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-input px-3 py-2 text-sm transition-colors hover:bg-accent focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card has-[:checked]:border-primary has-[:checked]:bg-accent"
                  >
                    <input
                      type="radio"
                      name={`report-reason-${review.id}`}
                      value={option.value}
                      checked={reason === option.value}
                      onChange={() => {
                        setReason(option.value)
                        setError(null)
                      }}
                      className="size-4 shrink-0 accent-primary"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={noteId} className="text-sm font-medium">
                  Add detail{' '}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </label>
                <span className="text-xs text-muted-foreground tabular">
                  {note.length} / {NOTE_MAX_LENGTH}
                </span>
              </div>
              <textarea
                id={noteId}
                value={note}
                onChange={(event) => {
                  setNote(event.target.value)
                  setError(null)
                }}
                maxLength={NOTE_MAX_LENGTH}
                rows={3}
                placeholder="What should the admin know about this review?"
                className="flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Reports are private. The buyer is not told who reported the review.
            </p>

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
              <Button type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                {submitting ? 'Reporting…' : 'Report review'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
