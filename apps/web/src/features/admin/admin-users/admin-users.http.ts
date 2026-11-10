import { api } from '@/services/api'
import type { AdminUsersPageDto } from './admin-users.dto'
import type { AdminUsersService } from './admin-users.service'
import type { AdminUsersFilters } from './admin-users.types'

export const adminUsersHttpService: AdminUsersService = {
  async list(
    filters: AdminUsersFilters,
    page: number,
  ): Promise<AdminUsersPageDto> {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.role) params.set('role', filters.role)
    params.set('page', String(page))

    return api<AdminUsersPageDto>(`/admin/users?${params.toString()}`)
  },
}
