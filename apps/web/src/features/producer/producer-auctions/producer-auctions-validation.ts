import type {
  AuctionField,
  AuctionFieldErrors,
  AuctionFormValues,
} from './producer-auctions.types'

const FIELD_ORDER: AuctionField[] = [
  'productId',
  'quantity',
  'basePrice',
  'increment',
  'duration',
  'startAt',
]

const FIELD_ALIASES: Record<string, AuctionField> = {
  productId: 'productId',
  product: 'productId',
  quantity: 'quantity',
  basePrice: 'basePrice',
  increment: 'increment',
  durationMinutes: 'duration',
  duration: 'duration',
  startsAt: 'startAt',
  startAt: 'startAt',
  startTime: 'startAt',
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

export function resolveDurationMinutes(values: AuctionFormValues): number {
  if (values.duration === 'custom') return Math.trunc(Number(values.customMinutes))
  return Math.trunc(Number(values.duration))
}

export function toDateTimeLocal(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

// Default to the next full hour so the producer only adjusts what matters.
export function defaultStartAt(): string {
  const next = new Date()
  next.setMinutes(0, 0, 0)
  next.setHours(next.getHours() + 1)
  return toDateTimeLocal(next.toISOString())
}

export function validateAuction(values: AuctionFormValues): AuctionFieldErrors {
  const errors: AuctionFieldErrors = {}

  if (!values.productId) errors.productId = 'Choose one of your products.'

  const quantity = Number(values.quantity)
  if (!values.quantity.trim()) errors.quantity = 'Lot quantity is required.'
  else if (!Number.isFinite(quantity)) errors.quantity = 'Enter the quantity as a number.'
  else if (!Number.isInteger(quantity)) errors.quantity = 'Use a whole number.'
  else if (quantity <= 0) errors.quantity = 'Quantity must be more than 0.'
  else if (quantity > 1000000) errors.quantity = 'Quantity must be 1,000,000 or less.'

  const basePrice = Number(values.basePrice)
  if (!values.basePrice.trim()) errors.basePrice = 'Base price is required.'
  else if (!Number.isFinite(basePrice)) errors.basePrice = 'Enter a price as a number.'
  else if (basePrice <= 0) errors.basePrice = 'Base price must be more than 0.'
  else if (basePrice > 100000) errors.basePrice = 'Base price must be 100,000 or less.'

  const increment = Number(values.increment)
  if (!values.increment.trim()) errors.increment = 'Minimum increment is required.'
  else if (!Number.isFinite(increment)) errors.increment = 'Enter an amount as a number.'
  else if (increment <= 0) errors.increment = 'Minimum increment must be more than 0.'
  else if (increment > 100000) errors.increment = 'Minimum increment must be 100,000 or less.'

  if (values.duration === 'custom') {
    const minutes = Number(values.customMinutes)
    if (!values.customMinutes.trim()) errors.duration = 'Enter the custom duration.'
    else if (!Number.isFinite(minutes)) errors.duration = 'Enter the duration as a number.'
    else if (!Number.isInteger(minutes)) errors.duration = 'Use whole minutes.'
    else if (minutes < 1) errors.duration = 'Duration must be at least 1 minute.'
    else if (minutes > 1440) errors.duration = 'Duration must be 24 hours or less.'
  } else if (!['15', '30', '60'].includes(values.duration)) {
    errors.duration = 'Choose a duration.'
  }

  if (!values.startAt.trim()) {
    errors.startAt = 'Start time is required.'
  } else {
    const start = new Date(values.startAt)
    if (Number.isNaN(start.getTime())) {
      errors.startAt = 'Enter a valid start date and time.'
    } else if (start.getTime() < Date.now() - 60_000) {
      errors.startAt = 'Start time must be in the future.'
    }
  }

  return errors
}

export function pickAuctionFieldErrors(
  fields: Record<string, string> | undefined,
): AuctionFieldErrors {
  const errors: AuctionFieldErrors = {}
  if (!fields) return errors
  for (const [key, message] of Object.entries(fields)) {
    const field = FIELD_ALIASES[key]
    if (field && message) errors[field] = message
  }
  return errors
}

export function focusFirstAuctionError(errors: AuctionFieldErrors): void {
  requestAnimationFrame(() => {
    for (const field of FIELD_ORDER) {
      if (!errors[field]) continue
      document.getElementById(field)?.focus()
      return
    }
  })
}

export function toAuctionInput(values: AuctionFormValues) {
  return {
    productId: values.productId,
    quantity: Math.trunc(Number(values.quantity)),
    basePrice: roundMoney(Number(values.basePrice)),
    increment: roundMoney(Number(values.increment)),
    durationMinutes: resolveDurationMinutes(values),
    startsAt: new Date(values.startAt).toISOString(),
  }
}
