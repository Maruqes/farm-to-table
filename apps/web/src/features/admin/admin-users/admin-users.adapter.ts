import type { AdminUserDto, AdminUsersPageDto } from './admin-users.dto'
import type {
  AdminUser,
  AdminUserState,
  AdminUsersPage,
} from './admin-users.types'

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asRole(value: unknown): AdminUser['role'] {
  const role = asString(value).toLowerCase()
  if (role === 'buyer' || role === 'producer' || role === 'admin') return role
  return 'unknown'
}

// Accept both the account state and the producer status some endpoints reuse.
function asState(dto: AdminUserDto | null | undefined): AdminUserState {
  const state = asString(dto?.state ?? dto?.status).toLowerCase()
  if (state === 'active' || state === 'approved') return 'active'
  if (state === 'pending') return 'pending'
  if (state === 'suspended' || state === 'blocked' || state === 'rejected') {
    return 'suspended'
  }
  return 'unknown'
}

export function adaptAdminUser(
  dto: AdminUserDto | null | undefined,
  index = 0,
): AdminUser {
  return {
    id: asString(dto?.id || dto?._id, `user-${index + 1}`),
    name: asString(dto?.name, 'Unnamed user'),
    email: asString(dto?.email),
    role: asRole(dto?.role),
    state: asState(dto),
  }
}

export function adaptAdminUsersPage(
  dto: AdminUsersPageDto | null | undefined,
): AdminUsersPage {
  const raw = Array.isArray(dto?.items) ? dto.items : []
  const items = raw.map((user, index) => adaptAdminUser(user, index))
  const reportedTotal =
    typeof dto?.total === 'number' && Number.isFinite(dto.total)
      ? Math.floor(dto.total)
      : items.length

  return {
    items,
    total: Math.max(items.length, reportedTotal, 0),
  }
}
