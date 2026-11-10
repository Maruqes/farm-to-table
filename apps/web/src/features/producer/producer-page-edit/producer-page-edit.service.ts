import { USE_MOCKS } from '@/services/env'
import type { ProducerPageDto } from './producer-page-edit.dto'
import { producerPageEditHttpService } from './producer-page-edit.http'
import { producerPageEditMockService } from './producer-page-edit.mock'
import type { ProducerPageInput } from './producer-page-edit.types'

export interface ProducerPageEditService {
  getMine(): Promise<ProducerPageDto>
  saveMine(input: ProducerPageInput): Promise<ProducerPageDto>
}

export const producerPageEditService: ProducerPageEditService = USE_MOCKS
  ? producerPageEditMockService
  : producerPageEditHttpService
