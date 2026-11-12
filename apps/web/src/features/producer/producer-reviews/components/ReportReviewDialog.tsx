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
          disabled={disabled}
          aria-label={`Report the review by ${review.author}`}
        >
          <Flag size={16} aria-hidden="true" />
          Report
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <Dialog.Title>Report this review</Dialog.Title>
              <Dialog.Description className="text-sm text-dim">
                Tell us why the review by {review.author} on {subject} should be
                checked. An admin decides whether to keep or hide it.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close report dialog">
                <X size={16} aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-2 rule pt-6" aria-describedby={error ? errorId : undefined}>
              <legend className="label-line">Reason</legend>
              <div className="flex flex-col gap-2">
                {REPORT_REASON_OPTIONS.map((option) => (
                  <label key={option.value} className="flex min-h-11 cursor-pointer items-center gap-3 border-2 border-ink p-2 px-3 text-sm hover:bg-wash has-checked:bg-wash focus-within:outline-2 focus-within:outline-ink focus-within:outline-offset-2">
                    <input
                      type="radio"
                      name={`report-reason-${review.id}`}
                      value={option.value}
                      checked={reason === option.value}
                      onChange={() => {
                        setReason(option.value)
                        setError(null)
                      }}
                      className="form-check-input"
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-4">
                <label htmlFor={noteId} className="form-label">
                  Add detail{' '}
                  <span className="normal-case text-dim">(optional)</span>
                </label>
                <span className="text-xs tabular text-dim">
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
                className="form-control min-h-20 resize-y"
              />
            </div>

            <p className="text-xs text-dim">
              Reports are private. The buyer is not told who reported the review.
            </p>

            {error && (
              <p
                id={errorId}
                role="alert"
                className="border-2 border-alarm p-2 px-3 text-sm text-alarm"
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
                  <Loader2 size={16} className="spin" aria-hidden="true" />
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
