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
        <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/40 dark:bg-background/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border bg-card p-5 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Dialog.Title className="text-xl">Rate {order.producer.name}</Dialog.Title>
              <Dialog.Description className="text-sm text-muted-foreground">
                Your rating is public on the producer’s page. You can rate this order once.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" aria-label="Close rating dialog">
                <X aria-hidden="true" />
              </Button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Your rating</legend>
              <div className="flex flex-wrap gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <label
                    key={value}
                    className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-card hover:bg-accent"
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
                      className="sr-only"
                      autoFocus={value === 1}
                    />
                    <Star
                      aria-hidden="true"
                      className={cn(
                        'size-6',
                        value <= rating
                          ? 'fill-current text-primary'
                          : 'text-muted-foreground',
                      )}
                    />
                    <span className="sr-only">
                      {value} star{value === 1 ? '' : 's'}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {rating > 0 ? `${rating} out of 5 stars` : 'Choose a star rating.'}
              </p>
            </fieldset>

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <label htmlFor={textId} className="text-sm font-medium">
                  Review <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <span className="text-xs text-muted-foreground tabular">
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
                className="flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-muted-foreground">
                Keep it specific: freshness, packaging and pickup are useful to other buyers.
              </p>
            </div>

            {error && (
              <p
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
                {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                {submitting ? 'Saving rating…' : 'Submit rating'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
