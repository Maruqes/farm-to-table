import { USE_MOCKS } from '@/services/env'
import type { AdminUsersPageDto } from './admin-users.dto'
import { adminUsersHttpService } from './admin-users.http'
import { adminUsersMockService } from './admin-users.mock'
import type { AdminUsersFilters } from './admin-users.types'

export interface AdminUsersService {
  list(filters: AdminUsersFilters, page: number): Promise<AdminUsersPageDto>
}

export const adminUsersService: AdminUsersService = USE_MOCKS
  ? adminUsersMockService
  : adminUsersHttpService
