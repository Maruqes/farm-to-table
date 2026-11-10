import { createContext } from 'react'
import type { CartItem } from './cart.types'

export interface CartContextValue {
  items: CartItem[]
  loading: boolean
  error: string | null
  notice: string | null
  saving: boolean
  reload: () => void
  setQuantity: (productId: string, quantity: number) => void
  removeLine: (productId: string) => void
}

export const CartContext = createContext<CartContextValue | null>(null)
