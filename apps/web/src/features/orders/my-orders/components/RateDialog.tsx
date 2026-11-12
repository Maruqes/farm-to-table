import { useId, useState, type FormEvent } from 'react'
import { Dialog } from 'radix-ui'
import { Loader2, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/utils'
import type { MyOrder, RateResult } from '../my-orders.types'

const MAX_TEXT_LENGTH = 500

interface RateDialogProps {
  order: MyOrder
  onSubmit: (orderId: string, rating: number, text: string) => Promise<RateResult>
}

export function RateDialog({ order, onSubmit }: RateDialogProps) {
  const textId = useId()
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      setRating(0)
      setText('')
      setError(null)
      setSubmitting(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    if (rating < 1) {
      setError('Choose a rating from 1 to 5 stars.')
      return
    }

    setError(null)
    setSubmitting(true)

    try {
      const result = await onSubmit(order.id, rating, text)
      if (result.ok || result.kind === 'already') {
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
        <Button>
          <Star aria-hidden="true" />
          Rate this order
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-panel">
          <div className="mb-4 d-flex align-items-start justify-content-between gap-3">
            <div className="vstack gap-1">
              <Dialog.Title className="mb-0">Rate {order.producer.name}</Dialog.Title>
              <Dialog.Description className="small text-body-secondary">
                Your rating is public on the producer’s page. You can rate this order once.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close rating dialog">
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="vstack gap-4">
            <fieldset className="vstack gap-2">
              <legend className="label-line mb-0">Your rating</legend>
              <div className="d-flex flex-wrap gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label
                    key={value}
                    className={cn(
                      'orders-star',
                      rating === value && 'is-active',
                    )}
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      checked={rating === value}
                      onChange={() => {
                        setRating(value)
                        setError(null)
                      }}
                      className="visually-hidden"
                      autoFocus={value === 1}
                    />
                    <Star
                      size={24}
                      fill={value <= rating ? 'currentColor' : 'none'}
                      aria-hidden="true"
                      className={cn(value <= rating && 'text-primary')}
                    />
                    <span className="visually-hidden">
                      {value} star{value === 1 ? '' : 's'}
                    </span>
                  </label>
                ))}
              </div>
              <p className="orders-note mb-0">
                {rating > 0 ? `${rating} out of 5 stars` : 'Choose a star rating.'}
              </p>
            </fieldset>

            <div className="vstack gap-2">
              <div className="d-flex align-items-baseline justify-content-between gap-3">
                <label htmlFor={textId} className="label-line mb-0">
                  Review <span className="fw-normal">(optional)</span>
                </label>
                <span className="small text-body-secondary tabular">
                  {text.length} / {MAX_TEXT_LENGTH}
                </span>
              </div>
              <textarea
                id={textId}
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={MAX_TEXT_LENGTH}
                rows={4}
                placeholder="What did you think of the produce and the producer?"
                className="form-control orders-review-text"
              />
              <p className="orders-note mb-0">
                Keep it specific: freshness, packaging and pickup are useful to other buyers.
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="frame-alarm px-3 py-2 small text-danger mb-0"
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
                {submitting && <Loader2 size={16} className="spin" aria-hidden="true" />}
                {submitting ? 'Saving rating…' : 'Submit rating'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
