import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '@/services/api'
import { adaptAdminServiceHealthList } from './admin-status.adapter'
import { adminStatusService } from './admin-status.service'
import {
  ADMIN_STATUS_REFRESH_MS,
  type AdminServiceHealth,
} from './admin-status.types'

const LOAD_ERROR =
  'Service status could not be loaded. Check your connection and try again.'

export function useAdminStatus() {
  const [services, setServices] = useState<AdminServiceHealth[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const [checkedAt, setCheckedAt] = useState<string | null>(null)

  const mountedRef = useRef(true)
  const inFlightRef = useRef(false)
  const hasDataRef = useRef(false)

  const load = useCallback(() => {
    if (inFlightRef.current) return
    inFlightRef.current = true

    adminStatusService
      .getStatus()
      .then((dto) => {
        if (!mountedRef.current) return

        hasDataRef.current = true
        setServices(adaptAdminServiceHealthList(dto))
        setCheckedAt(new Date().toISOString())
        setError(null)
        setRefreshError(null)
      })
      .catch((cause: unknown) => {
        if (!mountedRef.current) return

        const message = cause instanceof ApiError ? cause.message : LOAD_ERROR
        // Keep the last good values on a failed background refresh instead of
        // replacing the panel with a full-page error.
        if (hasDataRef.current) setRefreshError(message)
        else setError(message)
      })
      .finally(() => {
        inFlightRef.current = false
        if (!mountedRef.current) return

        setLoading(false)
        setRefreshing(false)
      })
  }, [])

  useEffect(() => {
    mountedRef.current = true
    load()

    const interval = window.setInterval(() => {
      if (hasDataRef.current) setRefreshing(true)
      load()
    }, ADMIN_STATUS_REFRESH_MS)

    return () => {
      mountedRef.current = false
      window.clearInterval(interval)
    }
  }, [load])

  const reload = useCallback(() => {
    setError(null)
    setRefreshError(null)
    if (hasDataRef.current) setRefreshing(true)
    else setLoading(true)
    load()
  }, [load])

  return useMemo(
    () => ({
      services,
      loading,
      refreshing,
      error,
      refreshError,
      checkedAt,
      empty: !loading && !error && services.length === 0,
      reload,
    }),
    [
      services,
      loading,
      refreshing,
      error,
      refreshError,
      checkedAt,
      reload,
    ],
  )
}
