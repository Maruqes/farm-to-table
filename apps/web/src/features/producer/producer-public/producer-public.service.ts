import { USE_MOCKS } from '@/services/env'
import type { ProducerPublic } from './producer-public.types'
import { producerPublicHttpService } from './producer-public.http'
import { producerPublicMockService } from './producer-public.mock'

export interface ProducerPublicService {
  getProducer(id: string): Promise<ProducerPublic>
}

export const producerPublicService: ProducerPublicService = USE_MOCKS
  ? producerPublicMockService
  : producerPublicHttpService
