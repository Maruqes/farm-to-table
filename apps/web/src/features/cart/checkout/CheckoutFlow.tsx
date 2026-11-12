import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageState } from '@/components/PageState'
import { Button } from '@/components/ui/button'
import { groupCartByProducer } from '../cart/cart-helpers'
import { useCart } from '../cart/useCart'
import { CheckoutForm } from './components/CheckoutForm'
import { CheckoutSummary } from './components/CheckoutSummary'
import { OrderSuccess } from './components/OrderSuccess'
import {
  focusFirstError,
  hasErrors,
  validateAddress,
  type AddressField,
} from './checkout-validation'
import type {
  CheckoutAddress,
  CheckoutFieldErrors,
  CheckoutInput,
  FulfilmentMethod,
} from './checkout.types'
import { useCheckout } from './useCheckout'

const EMPTY_ADDRESS: CheckoutAddress = { line1: '', city: '', postalCode: '' }

export function CheckoutFlow() {
  const { items, loading, error, reload } = useCart()
  const { orders, placing, placeOrder } = useCheckout()

  const groups = useMemo(() => groupCartByProducer(items), [items])
  const total = useMemo(
    () => groups.reduce((sum, group) => sum + group.subtotal, 0),
    [groups],
  )

  const [fulfilment, setFulfilment] = useState<FulfilmentMethod>('pickup')
  const [address, setAddress] = useState<CheckoutAddress>(EMPTY_ADDRESS)
  const [addressErrors, setAddressErrors] = useState<CheckoutFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [stockConflict, setStockConflict] = useState<string | null>(null)
  const [failureId, setFailureId] = useState(0)
  const [submittedInput, setSubmittedInput] = useState<CheckoutInput | null>(null)

  if (orders) {
    return <OrderSuccess orders={orders} input={submittedInput} />
  }

  const showForm = !loading && !error && items.length > 0
  const showEmpty = !loading && !error && items.length === 0

  function handleFulfilmentChange(next: FulfilmentMethod) {
    setFulfilment(next)
    setAddressErrors({})
    setFormError(null)
  }

  function handleAddressChange(field: AddressField, value: string) {
    setAddress((current) => ({ ...current, [field]: value }))
    setAddressErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
    setFormError(null)
  }

  function handleAddressBlur(field: AddressField) {
    if (fulfilment !== 'delivery') return
    const message = validateAddress(address)[field]
    setAddressErrors((current) => {
      const next = { ...current }
      if (message) next[field] = message
      else delete next[field]
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (placing) return

    setFormError(null)

    if (fulfilment === 'delivery') {
      const nextErrors = validateAddress(address)
      if (hasErrors(nextErrors)) {
        setAddressErrors(nextErrors)
        focusFirstError(nextErrors)
        return
      }
    }
    setAddressErrors({})

    const input: CheckoutInput =
      fulfilment === 'delivery'
        ? {
            fulfilment,
            address: {
              line1: address.line1.trim(),
              city: address.city.trim(),
              postalCode: address.postalCode.trim(),
            },
          }
        : { fulfilment }

    setSubmittedInput(input)
    const result = await placeOrder(input)
    if (result.ok) return

    if (result.kind === 'stock') {
      setStockConflict(result.message)
      setFailureId((current) => current + 1)
      return
    }

    if (result.kind === 'validation' && result.fieldErrors) {
      setAddressErrors(result.fieldErrors)
      setFormError(result.message)
      focusFirstError(result.fieldErrors)
      return
    }

    setFormError(result.message)
    setFailureId((current) => current + 1)
  }

  return (
    <section aria-labelledby="checkout-heading" className="vstack gap-4">
      <header className="d-flex flex-wrap align-items-end justify-content-between gap-3">
        <div className="vstack gap-1">
          <h1 id="checkout-heading" className="mb-0">Checkout</h1>
          {showForm && (
            <p className="text-body-secondary mb-0">
              Review your order and choose how to receive it. You pay each producer
              directly — there is no online payment.
            </p>
          )}
        </div>
        {showForm && (
          <Link
            to="/cart"
            className="small text-body-secondary"
          >
            Back to cart
          </Link>
        )}
      </header>

      <PageState
        loading={loading}
        error={error}
        errorMessage={error ?? undefined}
        onRetry={reload}
        empty={showEmpty}
        emptyMessage="Your cart is empty. Add fresh produce before checking out."
      >
        <div className="vstack gap-5">
          <CheckoutForm
            fulfilment={fulfilment}
            onFulfilmentChange={handleFulfilmentChange}
            address={address}
            addressErrors={addressErrors}
            onAddressChange={handleAddressChange}
            onAddressBlur={handleAddressBlur}
            formError={formError}
            stockConflict={stockConflict}
            placing={placing}
            failureId={failureId}
            onSubmit={handleSubmit}
          />

          <CheckoutSummary groups={groups} total={total} placing={placing} />
        </div>
      </PageState>

      {showEmpty && (
        <div className="d-flex justify-content-center">
          <Button asChild>
            <Link to="/">Browse the catalog</Link>
          </Button>
        </div>
      )}
    </section>
  )
}
