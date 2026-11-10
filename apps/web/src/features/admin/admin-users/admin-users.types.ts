// Domain model consumed by components and hooks. API shapes stay in admin-users.dto.ts.

import type { AuthRole } from '@/types/auth'

export type AdminUserRole = AuthRole

export type AdminUserState = 'active' | 'pending' | 'suspended' | 'unknown'

export type AdminUsersRoleFilter = AdminUserRole | ''

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminUserRole | 'unknown'
  state: AdminUserState
}

export interface AdminUsersPage {
  items: AdminUser[]
  total: number
}

export interface AdminUsersFilters {
  q: string
  role: AdminUsersRoleFilter
}

// The assumed API paginates with this fixed page size; the mock mirrors it.
export const ADMIN_USERS_PAGE_SIZE = 8
