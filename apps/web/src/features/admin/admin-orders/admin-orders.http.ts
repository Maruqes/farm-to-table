import { api } from '@/services/api'
import type { AdminOrdersPageDto } from './admin-orders.dto'
import type { AdminOrdersService } from './admin-orders.service'
import type { AdminOrdersFilters } from './admin-orders.types'

export const adminOrdersHttpService: AdminOrdersService = {
  async list(
    filters: AdminOrdersFilters,
    page: number,
  ): Promise<AdminOrdersPageDto> {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    params.set('page', String(page))

    return api<AdminOrdersPageDto>(`/admin/orders?${params.toString()}`)
  },
}
