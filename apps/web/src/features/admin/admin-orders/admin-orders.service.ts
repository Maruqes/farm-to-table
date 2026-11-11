import { USE_MOCKS } from '@/services/env'
import type { AdminOrdersPageDto } from './admin-orders.dto'
import { adminOrdersHttpService } from './admin-orders.http'
import { adminOrdersMockService } from './admin-orders.mock'
import type { AdminOrdersFilters } from './admin-orders.types'

export interface AdminOrdersService {
  list(filters: AdminOrdersFilters, page: number): Promise<AdminOrdersPageDto>
}

export const adminOrdersService: AdminOrdersService = USE_MOCKS
  ? adminOrdersMockService
  : adminOrdersHttpService
