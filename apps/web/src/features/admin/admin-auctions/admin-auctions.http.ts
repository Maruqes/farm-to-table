import { api } from '@/services/api'
import type { AdminAuctionsPageDto } from './admin-auctions.dto'
import type { AdminAuctionsService } from './admin-auctions.service'
import type { AdminAuctionsFilters } from './admin-auctions.types'

export const adminAuctionsHttpService: AdminAuctionsService = {
  async list(
    filters: AdminAuctionsFilters,
    page: number,
  ): Promise<AdminAuctionsPageDto> {
    const params = new URLSearchParams()
    if (filters.status) params.set('status', filters.status)
    params.set('page', String(page))

    return api<AdminAuctionsPageDto>(`/admin/auctions?${params.toString()}`)
  },
}
