import { USE_MOCKS } from '@/services/env'
import type { Cart, CartLineInput } from './cart.types'
import { cartHttpService } from './cart.http'
import { cartMockService } from './cart.mock'

export interface CartService {
  getCart(userId: string): Promise<Cart>
  updateCart(userId: string, items: CartLineInput[]): Promise<Cart>
}

export const cartService: CartService = USE_MOCKS ? cartMockService : cartHttpService
