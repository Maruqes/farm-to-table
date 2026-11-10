import { api } from '@/services/api'
import { adaptCart } from './cart.adapter'
import type { CartDto, CartUpdateDto } from './cart.dto'
import type { CartService } from './cart.service'
import type { Cart, CartLineInput } from './cart.types'

export const cartHttpService: CartService = {
  async getCart(): Promise<Cart> {
    const dto = await api<CartDto>('/cart')
    return adaptCart(dto)
  },

  async updateCart(_userId: string, items: CartLineInput[]): Promise<Cart> {
    const body: CartUpdateDto = {
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    }
    const dto = await api<CartDto>('/cart', {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    return adaptCart(dto)
  },
}
