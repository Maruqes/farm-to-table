import { api } from '@/services/api'
import { adaptPlacedOrders } from './checkout.adapter'
import type { CreateOrderRequestDto, OrderDto } from './checkout.dto'
import type { CheckoutService } from './checkout.service'
import type { CheckoutInput, PlacedOrder } from './checkout.types'

export const checkoutHttpService: CheckoutService = {
  async placeOrder(_userId: string, input: CheckoutInput): Promise<PlacedOrder[]> {
    const body: CreateOrderRequestDto = {
      fulfilment: input.fulfilment,
      ...(input.fulfilment === 'delivery' && input.address
        ? {
            address: {
              line1: input.address.line1,
              city: input.address.city,
              postalCode: input.address.postalCode,
            },
          }
        : {}),
    }

    const dto = await api<OrderDto[]>('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return adaptPlacedOrders(dto)
  },
}
