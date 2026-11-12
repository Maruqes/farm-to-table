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
          <div className="d-flex align-items-start justify-content-between gap-3 mb-4">
            <div className="vstack gap-1">
              <Dialog.Title>Report this review</Dialog.Title>
              <Dialog.Description className="small text-body-secondary">
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

          <form onSubmit={handleSubmit} className="vstack gap-4">
            <fieldset className="vstack gap-2 rule pt-4" aria-describedby={error ? errorId : undefined}>
              <legend className="label-line">Reason</legend>
              <div className="vstack gap-2">
                {REPORT_REASON_OPTIONS.map((option) => (
                  <label key={option.value} className="pa-report-option">
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

            <div className="vstack gap-2">
              <div className="d-flex align-items-baseline justify-content-between gap-3">
                <label htmlFor={noteId} className="form-label">
                  Add detail{' '}
                  <span className="pa-normal text-body-secondary">(optional)</span>
                </label>
                <span className="pa-xs text-body-secondary tabular">
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
                className="form-control pa-note-area"
              />
            </div>

            <p className="pa-xs text-body-secondary">
              Reports are private. The buyer is not told who reported the review.
            </p>

            {error && (
              <p
                id={errorId}
                role="alert"
                className="pa-alert-error"
              >
                {error}
              </p>
            )}

            <div className="d-flex flex-column-reverse flex-sm-row justify-content-sm-end gap-2">
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
