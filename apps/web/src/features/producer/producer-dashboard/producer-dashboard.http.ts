import { api } from '@/services/api'
import type { ProducerDashboardStatsDto } from './producer-dashboard.dto'
import type { ProducerDashboardService } from './producer-dashboard.service'

export const producerDashboardHttpService: ProducerDashboardService = {
  async getStats(): Promise<ProducerDashboardStatsDto> {
    return api<ProducerDashboardStatsDto>('/producers/me/stats')
  },
}
