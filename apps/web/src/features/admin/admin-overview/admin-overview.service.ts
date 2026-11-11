import { USE_MOCKS } from '@/services/env'
import type { AdminSummaryDto } from './admin-overview.dto'
import { adminOverviewHttpService } from './admin-overview.http'
import { adminOverviewMockService } from './admin-overview.mock'

export interface AdminOverviewService {
  getSummary(): Promise<AdminSummaryDto>
}

export const adminOverviewService: AdminOverviewService = USE_MOCKS
  ? adminOverviewMockService
  : adminOverviewHttpService
