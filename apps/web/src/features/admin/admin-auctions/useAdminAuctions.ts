import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/services/api'
import { adaptAdminAuctionsPage } from './admin-auctions.adapter'
import { adminAuctionsService } from './admin-auctions.service'
import {
  ADMIN_AUCTIONS_PAGE_SIZE,
  type AdminAuction,
  type AdminAuctionsFilters,
} from './admin-auctions.types'

const LOAD_ERROR =
  'Auctions could not be loaded. Check your connection and try again.'
const EMPTY_FILTERS: AdminAuctionsFilters = { status: '' }

export function useAdminAuctions() {
  const [auctions, setAuctions] = useState<AdminAuction[]>([])
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<AdminAuctionsFilters>(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [loadedKey, setLoadedKey] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const requestKey = `${filters.status}|${page}|${attempt}`
  const loading = loadedKey !== requestKey
  const pageCount = Math.max(1, Math.ceil(total / ADMIN_AUCTIONS_PAGE_SIZE))
  const hasFilters = filters.status !== ''
  // Never let the live region report a previous result while a new request is
  // loading or after it failed.
  const announcementText = loading || error ? '' : announcement

  useEffect(() => {
    let active = true

    adminAuctionsService
      .list(filters, page)
      .then((dto) => {
        if (!active) return

        const adapted = adaptAdminAuctionsPage(dto)
        const count = Math.max(
          1,
          Math.ceil(adapted.total / ADMIN_AUCTIONS_PAGE_SIZE),
        )

        // The data shrank while a later page was open; load the last real page.
        if (adapted.total > 0 && page > count) {
          setPage(count)
          return
        }

        setAuctions(adapted.items)
        setTotal(adapted.total)
        setError(null)
        setLoadedKey(requestKey)

        if (adapted.total === 0) {
          setAnnouncement(
            filters.status
              ? 'No auctions match the current filter.'
              : 'No auctions to show.',
          )
        } else {
          const noun = adapted.total === 1 ? 'auction' : 'auctions'
          const verb = adapted.total === 1 ? 'matches' : 'match'
          const filteredCopy = filters.status
            ? ` ${verb} the current filter`
            : ''
          setAnnouncement(
            `${adapted.total} ${noun}${filteredCopy}. Page ${page} of ${count}.`,
          )
        }
      })
      .catch((cause: unknown) => {
        if (!active) return

        const apiError = cause instanceof ApiError ? cause : null
        setAuctions([])
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

  const applyFilters = useCallback((next: AdminAuctionsFilters) => {
    setFilters({ status: next.status })
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
    setPage(1)
  }, [])

  return useMemo(
    () => ({
      auctions,
      total,
      page,
      pageCount,
      filters,
      hasFilters,
      loading,
      error,
      empty: !loading && !error && auctions.length === 0,
      announcement: announcementText,
      setPage,
      reload,
      applyFilters,
      clearFilters,
    }),
    [
      auctions,
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
