import { ApiError } from '@/services/api'
import { adaptCart } from './cart.adapter'
import type { CartDto, CartItemDto } from './cart.dto'
import type { CartService } from './cart.service'
import type { Cart, CartLineInput } from './cart.types'
import {
  createSeedCartItems,
  MOCK_CART_PRODUCTS,
  toCartItemDto,
} from './mocks/cart-items'

const MOCK_LATENCY_MS = 450
const STORAGE_PREFIX = 'ftt.cart.'
// Set `ftt.cart.mock-error` to `1` in the browser to exercise the load error and retry states.
export const MOCK_CART_ERROR_KEY = 'ftt.cart.mock-error'

function wait(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`
}

function readStoredItems(userId: string): CartItemDto[] | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    return parsed.filter(
      (value): value is CartItemDto => typeof value === 'object' && value !== null,
    )
  } catch {
    return null
  }
}

function writeStoredItems(userId: string, items: CartItemDto[]): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(items))
  } catch {
    // Cart still works for this session when storage is unavailable.
  }
}

function forceError(): boolean {
  try {
    return localStorage.getItem(MOCK_CART_ERROR_KEY) === '1'
  } catch {
    return false
  }
}

function toLineInput(items: CartLineInput[]): CartLineInput[] {
  return items.map((item) => ({
    productId: item.productId,
    quantity: Math.max(1, Math.floor(item.quantity)),
  }))
}

export const cartMockService: CartService = {
  async getCart(userId: string): Promise<Cart> {
    await wait()
    if (forceError()) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Your cart could not be loaded. Please try again.',
      )
    }

    const stored = readStoredItems(userId)
    const items = stored ?? createSeedCartItems()
    if (!stored) writeStoredItems(userId, items)
    return adaptCart({ items } satisfies CartDto)
  },

  async updateCart(userId: string, items: CartLineInput[]): Promise<Cart> {
    await wait()

    const current = readStoredItems(userId) ?? createSeedCartItems()
    const currentByProduct = new Map(
      current.map((item) => [item.productId ?? item.id ?? item._id ?? '', item]),
    )

    const updated = toLineInput(items).map((line) => {
      const existing = currentByProduct.get(line.productId)
      const product = MOCK_CART_PRODUCTS.find((entry) => entry.id === line.productId)
      const base = product ? toCartItemDto(product, line.quantity) : existing
      if (!base) {
        throw new ApiError(
          404,
          'PRODUCT_NOT_FOUND',
          'One of the products in your cart is no longer available. Remove it and try again.',
        )
      }

      const stock = product?.stock ?? base.stock ?? 0
      if (line.quantity > stock) {
        // Simulate the server lowering stock: refresh every stored line before the 409.
        const refreshed = current.flatMap((item) => {
          const entry = MOCK_CART_PRODUCTS.find(
            (candidate) =>
              candidate.id === (item.productId ?? item.id ?? item._id),
          )
          if (!entry) return [item]
          const quantity = Math.min(
            Math.max(1, Math.floor(item.quantity ?? 1)),
            entry.stock,
          )
          return [toCartItemDto(entry, quantity)]
        })
        writeStoredItems(userId, refreshed)
        throw new ApiError(
          409,
          'STOCK_CHANGED',
          `Only ${stock} ${base.unit} of ${base.name} left in stock. Your cart was refreshed.`,
        )
      }

      return { ...base, quantity: line.quantity }
    })

    writeStoredItems(userId, updated)
    return adaptCart({ items: updated } satisfies CartDto)
  },
}
