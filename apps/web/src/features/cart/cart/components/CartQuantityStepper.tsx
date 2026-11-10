import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface CartQuantityStepperProps {
  productId: string
  productName: string
  quantity: number
  stock: number
  onChange: (quantity: number) => void
}

function clamp(value: number, stock: number): number {
  return Math.min(Math.max(1, value), Math.max(1, stock))
}

export function CartQuantityStepper({
  productId,
  productName,
  quantity,
  stock,
  onChange,
}: CartQuantityStepperProps) {
  const inputId = `cart-quantity-${productId}`
  const upper = Math.max(1, stock)

  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={inputId} className="sr-only">
        Quantity for {productName}
      </label>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(clamp(quantity - 1, stock))}
        disabled={quantity <= 1}
        aria-label={`Decrease quantity for ${productName}`}
      >
        <Minus className="size-4" aria-hidden="true" />
      </Button>
      <Input
        id={inputId}
        type="number"
        inputMode="numeric"
        min={1}
        max={upper}
        value={quantity}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isNaN(next)) return
          onChange(clamp(Math.floor(next), stock))
        }}
        className="h-10 w-16 text-center tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(clamp(quantity + 1, stock))}
        disabled={quantity >= upper}
        aria-label={`Increase quantity for ${productName}`}
      >
        <Plus className="size-4" aria-hidden="true" />
      </Button>
    </div>
  )
}
