import { USE_MOCKS } from '@/services/env'
import type { ProducerDashboardStatsDto } from './producer-dashboard.dto'
import { producerDashboardHttpService } from './producer-dashboard.http'
import { producerDashboardMockService } from './producer-dashboard.mock'

export interface ProducerDashboardService {
  getStats(): Promise<ProducerDashboardStatsDto>
}

export const producerDashboardService: ProducerDashboardService = USE_MOCKS
  ? producerDashboardMockService
  : producerDashboardHttpService
