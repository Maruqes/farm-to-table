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
      className="flex flex-col gap-6"
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

      <div className="rule pt-6">
        <fieldset className="flex flex-col gap-4">
          <legend>Delivery method</legend>
          <p className="text-sm text-dim">
            Choose how you want to receive this order. Payment happens on pickup
            or delivery — there is no online payment.
          </p>

          <div className="grid gap-2 pt-1 sm:grid-cols-2">
            {FULFILMENT_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex cursor-pointer items-start gap-2.5 border-2 border-dim p-3 transition-colors duration-150 ease-out hover:border-ink focus-within:border-ink',
                  fulfilment === option.value && 'border-ink',
                )}
              >
                <input
                  type="radio"
                  name="fulfilment"
                  value={option.value}
                  checked={fulfilment === option.value}
                  onChange={() => onFulfilmentChange(option.value)}
                  disabled={placing}
                  className="form-check-input mt-0.5 flex-none"
                />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-sm text-dim">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {fulfilment === 'delivery' && (
        <div className="rule pt-6">
          <h2>Delivery address</h2>
          <p className="mt-1 text-sm text-dim">
            Each producer receives this address to deliver their part of the
            order.
          </p>
          <div className="mt-6">
            <AddressFields
              address={address}
              errors={addressErrors}
              disabled={placing}
              onChange={onAddressChange}
              onBlur={onAddressBlur}
            />
          </div>
        </div>
      )}
    </form>
  )
}
