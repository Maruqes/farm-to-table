import { USE_MOCKS } from '@/services/env'
import type { ProducerOrderDto } from './producer-orders.dto'
import { producerOrdersHttpService } from './producer-orders.http'
import { producerOrdersMockService } from './producer-orders.mock'
import type { OrderStatus } from './producer-orders.types'

export interface ProducerOrdersService {
  listMine(): Promise<ProducerOrderDto[]>
  updateStatus(id: string, status: OrderStatus): Promise<ProducerOrderDto>
}

export const producerOrdersService: ProducerOrdersService = USE_MOCKS
  ? producerOrdersMockService
  : producerOrdersHttpService
