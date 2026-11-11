import { useCallback, useState } from 'react'
import { useSession } from '@/context/session'
import { ApiError } from '@/services/api'
import { cartService } from '../cart/cart.service'
import { useCart } from '../cart/useCart'
import { checkoutService } from './checkout.service'
import type {
  CheckoutFieldErrors,
  CheckoutInput,
  PlaceOrderResult,
  PlacedOrder,
} from './checkout.types'

const ADDRESS_KEYS = ['line1', 'city', 'postalCode'] as const

function addressFieldErrors(
  fields: Record<string, string> | undefined,
): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {}
  if (!fields) return errors
  for (const key of ADDRESS_KEYS) {
    const message = fields[key] ?? fields[`address.${key}`]
    if (message) errors[key] = message
  }
  return errors
}

export function useCheckout() {
  const { user } = useSession()
  const { reload } = useCart()
  const [orders, setOrders] = useState<PlacedOrder[] | null>(null)
  const [placing, setPlacing] = useState(false)

  const placeOrder = useCallback(
    async (input: CheckoutInput): Promise<PlaceOrderResult> => {
      if (!user) {
        return {
          ok: false,
          kind: 'error',
          message: 'Your session has expired. Sign in again to place your order.',
        }
      }

      setPlacing(true)
      try {
        const created = await checkoutService.placeOrder(user.id, input)
        if (created.length === 0) {
          return {
            ok: false,
            kind: 'error',
            message: 'Your cart is empty. Add products before checking out.',
          }
        }

        setOrders(created)
        try {
          // Reuse the cart API so the server is the source of truth after checkout.
          await cartService.updateCart(user.id, [])
        } catch {
          // The order is already placed; the next cart load shows the server state.
        }
        reload()
        return { ok: true, orders: created }
      } catch (cause) {
        if (cause instanceof ApiError) {
          if (cause.code === 'STOCK_CHANGED') {
            return { ok: false, kind: 'stock', message: cause.message }
          }
          if (cause.code === 'VALIDATION_ERROR') {
            const fieldErrors = addressFieldErrors(cause.fields)
            return {
              ok: false,
              kind: 'validation',
              message: cause.message,
              fieldErrors:
                Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
            }
          }
          return { ok: false, kind: 'error', message: cause.message }
        }
        return {
          ok: false,
          kind: 'error',
          message: 'We could not place your order. Check your connection and try again.',
        }
      } finally {
        setPlacing(false)
      }
    },
    [user, reload],
  )

  return { orders, placing, placeOrder }
}
