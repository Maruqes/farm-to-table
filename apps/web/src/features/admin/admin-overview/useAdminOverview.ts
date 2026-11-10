import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/services/api'
import { adaptAdminSummary } from './admin-overview.adapter'
import { ADMIN_ORDER_STATUSES } from './admin-overview.labels'
import { adminOverviewService } from './admin-overview.service'
import type { AdminOverviewSummary } from './admin-overview.types'

const LOAD_ERROR =
  'The admin summary could not be loaded. Check your connection and try again.'

function isEmptySummary(summary: AdminOverviewSummary): boolean {
  return (
    summary.users === 0 &&
    summary.orders === 0 &&
    summary.activeAuctions === 0 &&
    summary.pendingProducers === 0 &&
    summary.salesPerDay.length === 0 &&
    ADMIN_ORDER_STATUSES.every((status) => summary.byStatus[status] === 0)
  )
}

export function useAdminOverview() {
  const [summary, setSummary] = useState<AdminOverviewSummary | null>(null)
  const [loadedKey, setLoadedKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  const requestKey = `admin-overview|${attempt}`
  const loading = loadedKey !== requestKey

  useEffect(() => {
    let active = true

    adminOverviewService
      .getSummary()
      .then((dto) => {
        if (!active) return
        setSummary(adaptAdminSummary(dto))
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        setSummary(null)
        setError(apiError?.message ?? LOAD_ERROR)
        setLoadedKey(requestKey)
      })

    return () => {
      active = false
    }
  }, [requestKey])

  const reload = useCallback(() => {
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  return {
    summary,
    loading,
    error,
    empty: summary ? isEmptySummary(summary) : false,
    reload,
  }
}
