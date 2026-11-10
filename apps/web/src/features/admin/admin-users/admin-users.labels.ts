import type {
  AdminUserRole,
  AdminUserState,
  AdminUsersRoleFilter,
} from './admin-users.types'

export const ADMIN_USER_ROLE_LABELS: Record<
  AdminUserRole | 'unknown',
  string
> = {
  buyer: 'Buyer',
  producer: 'Producer',
  admin: 'Admin',
  unknown: 'Unknown',
}

export const ADMIN_USER_STATE_LABELS: Record<AdminUserState, string> = {
  active: 'Active',
  pending: 'Pending',
  suspended: 'Suspended',
  unknown: 'Unknown',
}

export const ADMIN_USERS_ROLE_FILTER_OPTIONS: {
  value: AdminUsersRoleFilter
  label: string
}[] = [
  { value: '', label: 'All roles' },
  { value: 'buyer', label: 'Buyers' },
  { value: 'producer', label: 'Producers' },
  { value: 'admin', label: 'Admins' },
]
