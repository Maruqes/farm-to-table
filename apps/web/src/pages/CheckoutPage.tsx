import { CartProvider } from '@/features/cart/cart'
import { CheckoutFlow } from '@/features/cart/checkout'

export default function CheckoutPage() {
  return (
    <CartProvider>
      <CheckoutFlow />
    </CartProvider>
  )
}
