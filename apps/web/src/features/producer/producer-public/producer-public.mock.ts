import { ApiError } from '@/services/api'
import { adaptProducerPublic } from './producer-public.adapter'
import type { ProducerPublicService } from './producer-public.service'
import type { ProducerPublic } from './producer-public.types'
import {
  createMockProducerPublic,
  MOCK_ERROR_PRODUCER_ID,
  MOCK_HIDDEN_PRODUCER_ID,
} from './mocks/producers'

const MOCK_LATENCY_MS = 400

function wait(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS)
  })
}

export const producerPublicMockService: ProducerPublicService = {
  async getProducer(id: string): Promise<ProducerPublic> {
    await wait()
    if (id === MOCK_ERROR_PRODUCER_ID) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'This producer page could not be loaded. Please try again.',
      )
    }
    if (id === MOCK_HIDDEN_PRODUCER_ID) {
      throw new ApiError(
        404,
        'PRODUCER_NOT_FOUND',
        'This producer page is not available. It may have been removed or hidden.',
      )
    }
    const dto = createMockProducerPublic(id)
    if (!dto) {
      throw new ApiError(
        404,
        'PRODUCER_NOT_FOUND',
        'This producer page is not available. It may have been removed or hidden.',
      )
    }
    return adaptProducerPublic(dto)
  },
}
