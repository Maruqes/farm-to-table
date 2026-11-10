import { useContext } from 'react'
import { CartContext, type CartContextValue } from './cart-context'

export function useCart(): CartContextValue {
  const value = useContext(CartContext)
  if (!value) throw new Error('useCart must be used within a CartProvider')
  return value
}
