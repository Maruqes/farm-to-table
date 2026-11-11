import { api } from '@/services/api'
import type { AdminSummaryDto } from './admin-overview.dto'
import type { AdminOverviewService } from './admin-overview.service'

export const adminOverviewHttpService: AdminOverviewService = {
  async getSummary(): Promise<AdminSummaryDto> {
    return api<AdminSummaryDto>('/admin/summary')
  },
}
