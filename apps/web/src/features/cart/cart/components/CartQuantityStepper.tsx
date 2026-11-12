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
    <div className="d-flex align-items-center gap-2">
      <label htmlFor={inputId} className="visually-hidden">
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
        <Minus size={16} aria-hidden="true" />
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
        className="cart-qty-input tabular"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onChange(clamp(quantity + 1, stock))}
        disabled={quantity >= upper}
        aria-label={`Increase quantity for ${productName}`}
      >
        <Plus size={16} aria-hidden="true" />
      </Button>
    </div>
  )
}
