import { USE_MOCKS } from '@/services/env'
import type { CheckoutInput, PlacedOrder } from './checkout.types'
import { checkoutHttpService } from './checkout.http'
import { checkoutMockService } from './checkout.mock'

export interface CheckoutService {
  placeOrder(userId: string, input: CheckoutInput): Promise<PlacedOrder[]>
}

export const checkoutService: CheckoutService = USE_MOCKS
  ? checkoutMockService
  : checkoutHttpService
