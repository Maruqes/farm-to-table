import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/services/api'
import { adaptAdminUsersPage } from './admin-users.adapter'
import { adminUsersService } from './admin-users.service'
import {
  ADMIN_USERS_PAGE_SIZE,
  type AdminUser,
  type AdminUsersFilters,
} from './admin-users.types'

const LOAD_ERROR =
  'Users could not be loaded. Check your connection and try again.'
const EMPTY_FILTERS: AdminUsersFilters = { q: '', role: '' }

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<AdminUsersFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [loadedKey, setLoadedKey] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const requestKey = `${filters.q}|${filters.role}|${page}|${attempt}`
  const loading = loadedKey !== requestKey
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_USERS_PAGE_SIZE))
  const hasFilters = filters.q !== '' || filters.role !== ''
  // Never let the live region report a previous result while a new request is
  // loading or after it failed.
  const announcementText = loading || error ? '' : announcement

  useEffect(() => {
    let active = true

    adminUsersService
      .list(filters, page)
      .then((dto) => {
        if (!active) return

        const adapted = adaptAdminUsersPage(dto)
        const count = Math.max(
          1,
          Math.ceil(adapted.total / ADMIN_USERS_PAGE_SIZE),
        )

        // The data shrank while a later page was open; load the last real page.
        if (adapted.total > 0 && page > count) {
          setPage(count)
          return
        }

        setUsers(adapted.items)
        setTotal(adapted.total)
        setError(null)
        setLoadedKey(requestKey)

        if (adapted.total === 0) {
          setAnnouncement(
            filters.q || filters.role
              ? 'No users match the current filters.'
              : 'No users to show.',
          )
        } else {
          const noun = adapted.total === 1 ? 'user' : 'users'
          const verb = adapted.total === 1 ? 'matches' : 'match'
          const filteredCopy =
            filters.q || filters.role ? ` ${verb} the current filters` : ''
          setAnnouncement(
            `${adapted.total} ${noun}${filteredCopy}. Page ${page} of ${count}.`,
          )
        }
      })
      .catch((cause: unknown) => {
        if (!active) return

        const apiError = cause instanceof ApiError ? cause : null
        setUsers([])
        setTotal(0)
        setError(apiError?.message ?? LOAD_ERROR)
        setLoadedKey(requestKey)
      })

    return () => {
      active = false
    }
  }, [filters, page, requestKey])

  const reload = useCallback(() => {
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  const applyFilters = useCallback((next: AdminUsersFilters) => {
    setFilters({ q: next.q.trim(), role: next.role })
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }, [])

  return useMemo(
    () => ({
      users,
      total,
      page,
      pageCount,
      filters,
      hasFilters,
      loading,
      error,
      empty: !loading && !error && users.length === 0,
      announcement: announcementText,
      setPage,
      reload,
      applyFilters,
      clearFilters,
    }),
    [
      users,
      total,
      page,
      pageCount,
      filters,
      hasFilters,
      loading,
      error,
      announcementText,
      reload,
      applyFilters,
      clearFilters,
    ],
  )
}
