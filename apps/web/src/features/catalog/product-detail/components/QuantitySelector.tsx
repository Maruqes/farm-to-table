import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface QuantitySelectorProps {
  value: number
  max: number
  onChange: (value: number) => void
}

export function QuantitySelector({ value, max, onChange }: QuantitySelectorProps) {
  const upperBound = Math.max(1, max)
  const clamp = (next: number) => Math.min(Math.max(1, next), upperBound)

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="product-quantity" className="label-line mb-1 block">
        Quantity
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= 1}
          aria-label="Decrease quantity"
        >
          <Minus size={16} aria-hidden="true" />
        </Button>
        <Input
          id="product-quantity"
          type="number"
          inputMode="numeric"
          min={1}
          max={upperBound}
          value={value}
          onChange={(event) => onChange(clamp(Number(event.target.value) || 1))}
          aria-describedby="product-quantity-hint"
          className="w-16 text-center tabular"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= upperBound}
          aria-label="Increase quantity"
        >
          <Plus size={16} aria-hidden="true" />
        </Button>
      </div>
      <p id="product-quantity-hint" className="text-sm text-dim">
        Up to {upperBound} {upperBound === 1 ? 'unit' : 'units'} available.
      </p>
    </div>
  )
}
