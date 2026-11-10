import { USE_MOCKS } from '@/services/env'
import type {
  ProducerDirectoryItem,
  ProducersDirectoryQuery,
} from './producers-directory.types'
import { producersDirectoryHttpService } from './producers-directory.http'
import { producersDirectoryMockService } from './producers-directory.mock'

export interface ProducersDirectoryService {
  listProducers(query?: ProducersDirectoryQuery): Promise<ProducerDirectoryItem[]>
}

export const producersDirectoryService: ProducersDirectoryService = USE_MOCKS
  ? producersDirectoryMockService
  : producersDirectoryHttpService
