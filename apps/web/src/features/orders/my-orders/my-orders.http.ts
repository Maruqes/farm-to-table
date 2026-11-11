import { api } from '@/services/api'
import { adaptMyOrders } from './my-orders.adapter'
import type { CreateReviewRequestDto, MyOrderDto } from './my-orders.dto'
import type { MyOrdersService } from './my-orders.service'
import type { MyOrder, SubmitRatingInput } from './my-orders.types'

export const myOrdersHttpService: MyOrdersService = {
  async listMine(): Promise<MyOrder[]> {
    const dto = await api<MyOrderDto[]>('/orders/mine')
    return adaptMyOrders(dto)
  },

  async createReview(_userId: string, input: SubmitRatingInput): Promise<void> {
    const body: CreateReviewRequestDto = {
      orderId: input.orderId,
      rating: input.rating,
      text: input.text.trim(),
    }
    await api<unknown>('/reviews', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  },
}
