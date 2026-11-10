import { ApiError } from '@/services/api'
import type { AdminUsersPageDto } from './admin-users.dto'
import type { AdminUsersService } from './admin-users.service'
import {
  ADMIN_USERS_PAGE_SIZE,
  type AdminUsersFilters,
} from './admin-users.types'
import { listMockUsers } from './mocks/users'

const MOCK_LATENCY_MS = 450

// Set `ftt.admin-users.mock-error` to `1` to exercise the load error and retry states.
export const MOCK_ADMIN_USERS_ERROR_KEY = 'ftt.admin-users.mock-error'
// Set `ftt.admin-users.mock-empty` to `1` to exercise the empty state.
export const MOCK_ADMIN_USERS_EMPTY_KEY = 'ftt.admin-users.mock-empty'

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds)
  })
}

function isFlagOn(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

export const adminUsersMockService: AdminUsersService = {
  async list(
    filters: AdminUsersFilters,
    page: number,
  ): Promise<AdminUsersPageDto> {
    await wait(MOCK_LATENCY_MS)

    if (isFlagOn(MOCK_ADMIN_USERS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Users could not be loaded. Please try again.',
      )
    }

    if (isFlagOn(MOCK_ADMIN_USERS_EMPTY_KEY)) return { items: [], total: 0 }

    const query = filters.q.trim().toLowerCase()
    const filtered = listMockUsers().filter((user) => {
      const matchesRole = !filters.role || user.role === filters.role
      const matchesQuery =
        !query ||
        [user.name, user.email].some((value) =>
          (value ?? '').toLowerCase().includes(query),
        )
      return matchesRole && matchesQuery
    })

    const start = (Math.max(1, page) - 1) * ADMIN_USERS_PAGE_SIZE
    return {
      items: filtered.slice(start, start + ADMIN_USERS_PAGE_SIZE),
      total: filtered.length,
    }
  },
}
