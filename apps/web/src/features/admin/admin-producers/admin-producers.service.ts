import { USE_MOCKS } from '@/services/env'
import type { PendingProducerDto } from './admin-producers.dto'
import { adminProducersHttpService } from './admin-producers.http'
import { adminProducersMockService } from './admin-producers.mock'

export interface AdminProducersService {
  listPending(): Promise<PendingProducerDto[]>
  approve(id: string): Promise<void>
  reject(id: string, reason?: string): Promise<void>
}

export const adminProducersService: AdminProducersService = USE_MOCKS
  ? adminProducersMockService
  : adminProducersHttpService
