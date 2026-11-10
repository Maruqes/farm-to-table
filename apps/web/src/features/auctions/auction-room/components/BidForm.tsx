import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatMoney } from '@/services/format'
import type { AuctionRoom, PlaceBidResult } from '../auction-room.types'

interface BidFormProps {
  auction: AuctionRoom
  bidding: boolean
  onPlaceBid: (amount: number) => Promise<PlaceBidResult>
  onEdit: () => void
}

function roundMoney(value: number): number {
  return Math.round(Math.max(0, value) * 100) / 100
}

export function BidForm({ auction, bidding, onPlaceBid, onEdit }: BidFormProps) {
  const inputId = useId()
  const hintId = useId()
  const errorId = useId()

  const minimum = roundMoney(auction.currentPrice + auction.increment)
  const [amount, setAmount] = useState(() => minimum.toFixed(2))
  const [edited, setEdited] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  // Until the buyer edits, the field follows a rising minimum without an effect.
  const parsedAmount = Number(amount)
  const shownAmount =
    !edited && Number.isFinite(parsedAmount) && parsedAmount < minimum
      ? minimum.toFixed(2)
      : amount

  const handleEdit = () => {
    setEdited(true)
    setLocalError(null)
    onEdit()
  }

  const quickBid = (delta: number) => {
    const value = roundMoney(Math.max(minimum, auction.currentPrice + delta))
    setAmount(value.toFixed(2))
    handleEdit()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!shownAmount.trim() || !Number.isFinite(Number(shownAmount))) {
      setLocalError('Enter a bid amount.')
      return
    }

    const value = roundMoney(Number(shownAmount))
    if (value < minimum) {
      setLocalError(`Your bid must be at least ${formatMoney(minimum)}.`)
      return
    }

    setLocalError(null)
    const result = await onPlaceBid(value)
    if (result.ok) {
      setEdited(false)
    } else if (result.kind !== 'rejected') {
      setLocalError(result.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label htmlFor={inputId} className="text-sm font-medium">
          Your bid
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
            >
              €
            </span>
            <Input
              id={inputId}
              type="number"
              inputMode="decimal"
              min={minimum}
              step={auction.increment}
              value={shownAmount}
              onChange={(event) => {
                setAmount(event.target.value)
                handleEdit()
              }}
              aria-describedby={`${hintId}${localError ? ` ${errorId}` : ''}`}
              aria-invalid={localError ? true : undefined}
              disabled={bidding}
              className="h-11 pl-7 text-base"
            />
          </div>
          <Button type="submit" disabled={bidding} className="h-11 shrink-0">
            {bidding ? 'Placing bid…' : 'Place bid'}
          </Button>
        </div>
        <p id={hintId} className="text-xs text-muted-foreground">
          Minimum {formatMoney(minimum)} — current price {formatMoney(auction.currentPrice)} plus{' '}
          {formatMoney(auction.increment)} increment.
        </p>
        {localError && (
          <p id={errorId} role="alert" className="text-sm text-destructive">
            {localError}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="text-sm font-medium">Quick bids</p>
        <div className="flex flex-wrap gap-2">
          {[5, 10, 25].map((delta) => {
            const value = roundMoney(Math.max(minimum, auction.currentPrice + delta))
            return (
              <Button
                key={delta}
                type="button"
                variant="outline"
                onClick={() => quickBid(delta)}
                disabled={bidding}
                aria-label={`Bid ${formatMoney(value)}`}
                className="h-10"
              >
                +€{delta}
              </Button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Quick bids add to the current price. Your bid must reach the minimum.
        </p>
      </div>
    </form>
  )
}
