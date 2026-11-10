import { useEffect, useRef, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/utils'
import type {
  CheckoutAddress,
  CheckoutFieldErrors,
  FulfilmentMethod,
} from '../checkout.types'
import type { AddressField } from '../checkout-validation'
import { AddressFields } from './AddressFields'
import { CheckoutAlert } from './CheckoutAlert'

export const CHECKOUT_FORM_ID = 'checkout-form'

const FULFILMENT_OPTIONS: {
  value: FulfilmentMethod
  label: string
  description: string
}[] = [
  {
    value: 'pickup',
    label: 'Pickup',
    description: 'Collect at the farm and pay when you pick up.',
  },
  {
    value: 'delivery',
    label: 'Delivery',
    description: 'Delivered to your address; pay on delivery.',
  },
]

interface CheckoutFormProps {
  fulfilment: FulfilmentMethod
  onFulfilmentChange: (fulfilment: FulfilmentMethod) => void
  address: CheckoutAddress
  addressErrors: CheckoutFieldErrors
  onAddressChange: (field: AddressField, value: string) => void
  onAddressBlur: (field: AddressField) => void
  formError: string | null
  stockConflict: string | null
  placing: boolean
  failureId: number
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function CheckoutForm({
  fulfilment,
  onFulfilmentChange,
  address,
  addressErrors,
  onAddressChange,
  onAddressBlur,
  formError,
  stockConflict,
  placing,
  failureId,
  onSubmit,
}: CheckoutFormProps) {
  const alertRef = useRef<HTMLDivElement>(null)

  // A failed submit can leave the CTA below the viewport; bring the error into view.
  useEffect(() => {
    if (failureId === 0) return
    const alert = alertRef.current
    if (!alert) return

    alert.focus({ preventScroll: true })
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    alert.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    })
  }, [failureId])

  return (
    <form
      id={CHECKOUT_FORM_ID}
      onSubmit={onSubmit}
      noValidate
      aria-busy={placing}
      className="space-y-4 md:space-y-6"
    >
      {stockConflict && (
        <CheckoutAlert
          containerRef={alertRef}
          title="Stock changed"
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/cart">Review your cart</Link>
            </Button>
          }
        >
          {stockConflict}
        </CheckoutAlert>
      )}

      {formError && (
        <CheckoutAlert
          containerRef={alertRef}
          title="We could not place your order"
        >
          {formError}
        </CheckoutAlert>
      )}

      <div className="rounded-xl border bg-card p-5 md:p-6">
        <fieldset className="space-y-3">
          <legend className="text-lg font-semibold">Delivery method</legend>
          <p className="text-sm text-muted-foreground">
            Choose how you want to receive this order. Payment happens on pickup
            or delivery — there is no online payment.
          </p>

          <div className="grid gap-2 sm:grid-cols-2">
            {FULFILMENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-3 transition-colors',
                  fulfilment === option.value
                    ? 'border-primary bg-accent/60'
                    : 'border-input bg-background hover:bg-accent/40',
                )}
              >
                <input
                  type="radio"
                  name="fulfilment"
                  value={option.value}
                  checked={fulfilment === option.value}
                  onChange={() => onFulfilmentChange(option.value)}
                  disabled={placing}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-sm text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {fulfilment === 'delivery' && (
          <div className="mt-6 space-y-4 border-t pt-5">
            <div className="space-y-1">
              <h2 className="text-lg">Delivery address</h2>
              <p className="text-sm text-muted-foreground">
                Each producer receives this address to deliver their part of the
                order.
              </p>
            </div>
            <AddressFields
              address={address}
              errors={addressErrors}
              disabled={placing}
              onChange={onAddressChange}
              onBlur={onAddressBlur}
            />
          </div>
        )}
      </div>
    </form>
  )
}
