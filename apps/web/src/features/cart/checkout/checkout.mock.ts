import { ApiError } from '@/services/api'
import { adaptPlacedOrders } from './checkout.adapter'
import type { CartItemDto } from '../cart/cart.dto'
import { createSeedCartItems } from '../cart/mocks/cart-items'
import type { CheckoutService } from './checkout.service'
import type { CheckoutInput, PlacedOrder } from './checkout.types'
import { buildOrderDtos } from './mocks/checkout-orders'

const MOCK_LATENCY_MS = 650
// Mirrors the storage the cart mock writes, so checkout sees the same lines the page shows.
const CART_STORAGE_PREFIX = 'ftt.cart.'
// Set `ftt.checkout.mock-stock-conflict` to `1` in the browser to exercise the 409 recovery path.
export const MOCK_CHECKOUT_STOCK_KEY = 'ftt.checkout.mock-stock-conflict'
// Set `ftt.checkout.mock-error` to `1` in the browser to exercise the generic error state.
export const MOCK_CHECKOUT_ERROR_KEY = 'ftt.checkout.mock-error'

function wait(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })
}

function isFlagOn(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function cartStorageKey(userId: string): string {
  return `${CART_STORAGE_PREFIX}${userId}`
}

function readCartItems(userId: string): CartItemDto[] {
  try {
    const raw = localStorage.getItem(cartStorageKey(userId))
    if (!raw) return createSeedCartItems()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return createSeedCartItems()
    return parsed.filter(
      (value): value is CartItemDto => typeof value === 'object' && value !== null,
    )
  } catch {
    return createSeedCartItems()
  }
}

function writeCartItems(userId: string, items: CartItemDto[]): void {
  try {
    localStorage.setItem(cartStorageKey(userId), JSON.stringify(items))
  } catch {
    // Clearing the cart still works for this session when storage is unavailable.
  }
}

function validateInput(input: CheckoutInput): void {
  if (input.fulfilment !== 'pickup' && input.fulfilment !== 'delivery') {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Choose pickup or delivery.')
  }
  if (input.fulfilment !== 'delivery') return

  const fields: Record<string, string> = {}
  if (!input.address?.line1?.trim()) fields.line1 = 'Address line is required.'
  if (!input.address?.city?.trim()) fields.city = 'City is required.'
  if (!input.address?.postalCode?.trim()) {
    fields.postalCode = 'Postal code is required.'
  }
  if (Object.keys(fields).length > 0) {
    throw new ApiError(
      400,
      'VALIDATION_ERROR',
      'Check your delivery address and try again.',
      fields,
    )
  }
}

export const checkoutMockService: CheckoutService = {
  async placeOrder(
    userId: string,
    input: CheckoutInput,
  ): Promise<PlacedOrder[]> {
    await wait()

    if (isFlagOn(MOCK_CHECKOUT_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Your order could not be placed. Please try again.',
      )
    }

    validateInput(input)

    const items = readCartItems(userId)
    if (items.length === 0) {
      throw new ApiError(
        400,
        'VALIDATION_ERROR',
        'Your cart is empty. Add products before checking out.',
      )
    }

    if (isFlagOn(MOCK_CHECKOUT_STOCK_KEY)) {
      const name =
        typeof items[0]?.name === 'string' ? items[0].name : 'one of your products'
      throw new ApiError(
        409,
        'STOCK_CHANGED',
        `Stock changed for ${name} while you were checking out. Review your cart and try again.`,
      )
    }

    const orders = buildOrderDtos(userId, items)
    writeCartItems(userId, [])
    return adaptPlacedOrders(orders)
  },
}
