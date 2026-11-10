import { USE_MOCKS } from '@/services/env'
import type { ProducerReviewDto } from './producer-reviews.dto'
import { producerReviewsHttpService } from './producer-reviews.http'
import { producerReviewsMockService } from './producer-reviews.mock'

export interface ProducerReviewsService {
  listMine(): Promise<ProducerReviewDto[]>
  report(id: string, reason: string): Promise<ProducerReviewDto>
}

export const producerReviewsService: ProducerReviewsService = USE_MOCKS
  ? producerReviewsMockService
  : producerReviewsHttpService
