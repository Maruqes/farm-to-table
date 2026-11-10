import {
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarClock, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/components/ui/utils'
import { DURATION_OPTIONS } from '../producer-auctions.labels'
import {
  defaultStartAt,
  focusFirstAuctionError,
  pickAuctionFieldErrors,
  toAuctionInput,
  toDateTimeLocal,
  validateAuction,
} from '../producer-auctions-validation'
import { useAuctionProductOptions } from '../useAuctionProductOptions'
import type {
  AuctionActionResult,
  AuctionFieldErrors,
  AuctionFormValues,
  AuctionInput,
  AuctionSaveIntent,
  ProducerAuction,
} from '../producer-auctions.types'

const selectClassName =
  'h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

const STANDARD_DURATIONS = [15, 30, 60]

interface AuctionFormProps {
  auction: ProducerAuction | null
  onSave: (input: AuctionInput, intent: AuctionSaveIntent) => Promise<AuctionActionResult>
  onCancel: () => void
}

function durationValue(minutes: number): string {
  return STANDARD_DURATIONS.includes(minutes) ? String(minutes) : 'custom'
}

function toFormValues(auction: ProducerAuction | null): AuctionFormValues {
  return {
    productId: auction?.product.id ?? '',
    quantity: auction ? String(auction.quantity) : '',
    basePrice: auction ? String(auction.basePrice) : '',
    increment: auction ? String(auction.increment) : '1',
    duration: auction ? durationValue(auction.durationMinutes) : '30',
    customMinutes:
      auction && !STANDARD_DURATIONS.includes(auction.durationMinutes)
        ? String(auction.durationMinutes)
        : '',
    startAt: auction?.startsAt ? toDateTimeLocal(auction.startsAt) : defaultStartAt(),
  }
}

function withoutField(
  errors: AuctionFieldErrors,
  field: keyof AuctionFieldErrors,
): AuctionFieldErrors {
  if (!errors[field]) return errors
  const next = { ...errors }
  delete next[field]
  return next
}

function FormAlert({ children }: { children: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  )
}

interface FieldMessageProps {
  id: string
  error?: string
  hint?: string
}

function FieldMessage({ id, error, hint }: FieldMessageProps) {
  if (error) {
    return (
      <p id={`${id}-error`} className="text-sm text-destructive">
        {error}
      </p>
    )
  }
  if (hint) {
    return (
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        {hint}
      </p>
    )
  }
  return null
}

function describedBy(id: string, error?: string, hint?: string): string | undefined {
  if (error) return `${id}-error`
  if (hint) return `${id}-hint`
  return undefined
}

interface TextFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  id: 'quantity' | 'basePrice' | 'increment' | 'customMinutes'
  label: string
  error?: string
  hint?: string
}

function TextField({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className={cn(
          'h-10',
          error && 'border-destructive focus-visible:ring-destructive',
          className,
        )}
        {...props}
      />
      <FieldMessage id={id} error={error} hint={hint} />
    </div>
  )
}

export function AuctionForm({ auction, onSave, onCancel }: AuctionFormProps) {
  const { products, loading: productsLoading, error: productsError, reload } =
    useAuctionProductOptions()
  const [values, setValues] = useState<AuctionFormValues>(() => toFormValues(auction))
  const [errors, setErrors] = useState<AuctionFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeIntent, setActiveIntent] = useState<AuctionSaveIntent>('draft')
  const intentRef = useRef<AuctionSaveIntent>('draft')

  const selectedProduct = products.find((product) => product.id === values.productId)
  const unit = selectedProduct?.unit ?? 'units'
  const productsReady = !productsLoading && !productsError && products.length > 0
  const selectedId = selectedProduct ? values.productId : ''

  useEffect(() => {
    document.getElementById('productId')?.focus()
  }, [])

  function update<Key extends keyof AuctionFormValues>(
    field: Key,
    value: AuctionFormValues[Key],
  ) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => withoutField(current, field as keyof AuctionFieldErrors))
    setFormError(null)
  }

  function chooseIntent(intent: AuctionSaveIntent) {
    intentRef.current = intent
    setActiveIntent(intent)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving || !productsReady) return

    const nextErrors = validateAuction(values)
    if (!products.some((product) => product.id === values.productId)) {
      nextErrors.productId = 'Choose one of your products.'
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setFormError('Please check the highlighted fields and try again.')
      focusFirstAuctionError(nextErrors)
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      const result = await onSave(toAuctionInput(values), intentRef.current)
      if (!result.ok) {
        const fieldErrors = pickAuctionFieldErrors(result.fields)
        setFormError(result.message)
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors)
          focusFirstAuctionError(fieldErrors)
        }
      }
    } catch {
      setFormError('The auction could not be saved. Check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-busy={saving} className="space-y-5">
      {formError && <FormAlert>{formError}</FormAlert>}

      {productsError && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <p className="min-w-0 flex-1">{productsError}</p>
          <Button type="button" variant="outline" size="sm" onClick={reload}>
            Try again
          </Button>
        </div>
      )}

      {!productsLoading && !productsError && products.length === 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed px-3 py-3 text-sm">
          <Package className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-muted-foreground">
            You have no products yet. Add one before creating an auction.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/producer/products">Add a product</Link>
          </Button>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="productId" className="block text-sm font-medium">
          Product
        </label>
        <select
          id="productId"
          value={selectedId}
          onChange={(event) => update('productId', event.target.value)}
          aria-invalid={errors.productId ? true : undefined}
          aria-describedby={describedBy(
            'productId',
            errors.productId,
            'Choose one of your own products for this lot.',
          )}
          disabled={productsLoading || Boolean(productsError) || products.length === 0}
          className={cn(
            selectClassName,
            errors.productId && 'border-destructive focus-visible:ring-destructive',
          )}
          required
        >
          <option value="">
            {productsLoading ? 'Loading your products…' : 'Choose a product'}
          </option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} ({product.unit})
            </option>
          ))}
        </select>
        <FieldMessage
          id="productId"
          error={errors.productId}
          hint="Choose one of your own products for this lot."
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <TextField
          id="quantity"
          label="Lot quantity"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={values.quantity}
          onChange={(event) => update('quantity', event.target.value)}
          error={errors.quantity}
          hint={`How many ${unit} are in this lot.`}
          required
        />

        <TextField
          id="basePrice"
          label="Base price (€)"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={values.basePrice}
          onChange={(event) => update('basePrice', event.target.value)}
          error={errors.basePrice}
          hint="Where bidding starts."
          required
        />

        <TextField
          id="increment"
          label="Minimum increment (€)"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={values.increment}
          onChange={(event) => update('increment', event.target.value)}
          error={errors.increment}
          hint="The smallest raise between bids."
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="duration" className="block text-sm font-medium">
            Duration
          </label>
          <select
            id="duration"
            value={values.duration}
            onChange={(event) => update('duration', event.target.value)}
            aria-invalid={errors.duration ? true : undefined}
            aria-describedby={describedBy('duration', errors.duration)}
            className={cn(
              selectClassName,
              errors.duration && 'border-destructive focus-visible:ring-destructive',
            )}
          >
            {DURATION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {values.duration === 'custom' && (
            <div className="space-y-1.5 pt-1">
              <label htmlFor="customMinutes" className="block text-sm font-medium">
                Custom length (minutes)
              </label>
              <Input
                id="customMinutes"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={values.customMinutes}
                onChange={(event) => update('customMinutes', event.target.value)}
                aria-invalid={errors.duration ? true : undefined}
                aria-describedby={errors.duration ? 'duration-error' : undefined}
                className={cn(
                  'h-10',
                  errors.duration &&
                    'border-destructive focus-visible:ring-destructive',
                )}
              />
            </div>
          )}

          <FieldMessage id="duration" error={errors.duration} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="startAt" className="block text-sm font-medium">
            Start time
          </label>
          <Input
            id="startAt"
            type="datetime-local"
            value={values.startAt}
            onChange={(event) => update('startAt', event.target.value)}
            aria-invalid={errors.startAt ? true : undefined}
            aria-describedby={describedBy('startAt', errors.startAt)}
            className={cn(
              'h-10',
              errors.startAt && 'border-destructive focus-visible:ring-destructive',
            )}
            required
          />
          <FieldMessage
            id="startAt"
            error={errors.startAt}
            hint="Bidding opens at this time and runs for the duration."
          />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
        <CalendarClock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Publish to schedule the lot. You can still edit or cancel it until the first
          bid arrives.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="submit"
          variant="outline"
          disabled={saving || !productsReady}
          onClick={() => chooseIntent('draft')}
        >
          {saving && activeIntent === 'draft'
            ? 'Saving…'
            : auction
              ? 'Save changes'
              : 'Save draft'}
        </Button>
        <Button
          type="submit"
          disabled={saving || !productsReady}
          onClick={() => chooseIntent('publish')}
        >
          {saving && activeIntent === 'publish' ? 'Publishing…' : 'Publish auction'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
