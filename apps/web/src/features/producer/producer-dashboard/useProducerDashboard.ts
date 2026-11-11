import { useCallback, useEffect, useState } from 'react'
import { useSession } from '@/context/session'
import { ApiError } from '@/services/api'
import { adaptProducerDashboard } from './producer-dashboard.adapter'
import { DASHBOARD_ORDER_STATUSES } from './producer-dashboard.labels'
import { createProducerDashboardRealtime } from './producer-dashboard.realtime'
import { producerDashboardService } from './producer-dashboard.service'
import type { ProducerDashboardStats } from './producer-dashboard.types'

const LOAD_ERROR =
  'Your dashboard could not be loaded. Check your connection and try again.'
const REFRESH_ERROR =
  'The dashboard could not refresh. It will try again on the next order update.'

function isEmptyDashboard(stats: ProducerDashboardStats): boolean {
  return (
    stats.sales === 0 &&
    stats.toHandle === 0 &&
    stats.activeProducts === 0 &&
    stats.averageRating === 0 &&
    stats.salesPerDay.length === 0 &&
    stats.lowStock.length === 0 &&
    stats.activeAuction === null &&
    DASHBOARD_ORDER_STATUSES.every((status) => stats.byStatus[status] === 0)
  )
}

export function useProducerDashboard() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const [stats, setStats] = useState<ProducerDashboardStats | null>(null)
  const [loadedKey, setLoadedKey] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [announcement, setAnnouncement] = useState('')

  const requestKey = `dashboard|${attempt}`
  const loading = loadedKey !== requestKey

  useEffect(() => {
    let active = true

    producerDashboardService
      .getStats()
      .then((dto) => {
        if (!active) return
        setStats(adaptProducerDashboard(dto))
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        setStats(null)
        setError(apiError?.message ?? LOAD_ERROR)
        setLoadedKey(requestKey)
      })

    return () => {
      active = false
    }
  }, [requestKey])

  const refresh = useCallback(async (): Promise<boolean> => {
    try {
      const dto = await producerDashboardService.getStats()
      setStats(adaptProducerDashboard(dto))
      setError(null)
      return true
    } catch (cause) {
      const apiError = cause instanceof ApiError ? cause : null
      setAnnouncement(apiError?.message ?? REFRESH_ERROR)
      return false
    }
  }, [])

  useEffect(() => {
    if (!userId) return

    const realtime = createProducerDashboardRealtime()
    return realtime.subscribe(userId, () => {
      void refresh().then((ok) => {
        if (ok) setAnnouncement('Your dashboard is up to date.')
      })
    })
  }, [refresh, userId])

  const reload = useCallback(() => {
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  return {
    stats,
    loading,
    error,
    empty: stats ? isEmptyDashboard(stats) : false,
    announcement,
    reload,
  }
}
