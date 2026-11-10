import { USE_MOCKS } from '@/services/env'
import type { MyOrder, SubmitRatingInput } from './my-orders.types'
import { myOrdersHttpService } from './my-orders.http'
import { myOrdersMockService } from './my-orders.mock'

export interface MyOrdersService {
  listMine(userId: string): Promise<MyOrder[]>
  createReview(userId: string, input: SubmitRatingInput): Promise<void>
}

export const myOrdersService: MyOrdersService = USE_MOCKS
  ? myOrdersMockService
  : myOrdersHttpService
