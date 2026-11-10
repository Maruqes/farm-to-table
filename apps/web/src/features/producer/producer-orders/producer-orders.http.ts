import { api } from '@/services/api'
import type {
  ProducerOrderDto,
  UpdateOrderStatusRequestDto,
} from './producer-orders.dto'
import type { ProducerOrdersService } from './producer-orders.service'
import type { OrderStatus } from './producer-orders.types'

export const producerOrdersHttpService: ProducerOrdersService = {
  async listMine(): Promise<ProducerOrderDto[]> {
    return api<ProducerOrderDto[]>('/orders?producer=me')
  },

  async updateStatus(id: string, status: OrderStatus): Promise<ProducerOrderDto> {
    const body: UpdateOrderStatusRequestDto = { status }
    return api<ProducerOrderDto>(`/orders/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
}
