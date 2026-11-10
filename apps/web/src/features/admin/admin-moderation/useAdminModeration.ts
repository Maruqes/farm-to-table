import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError } from '@/services/api'
import {
  adaptAdminContentItem,
  adaptAdminContentItems,
} from './admin-moderation.adapter'
import { adminModerationService } from './admin-moderation.service'
import type {
  AdminContentItem,
  ContentType,
  ModerationActionResult,
} from './admin-moderation.types'

const LOAD_ERROR =
  'Content could not be loaded. Check your connection and try again.'
const ACTION_ERROR =
  'The change could not be saved. Check your connection and try again.'
const BUSY_MESSAGE = 'This item is still saving. Please wait a moment.'

export function useAdminModeration(type: ContentType) {
  const [items, setItems] = useState<AdminContentItem[]>([])
  const [loadedKey, setLoadedKey] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [announcement, setAnnouncement] = useState('')

  const typeRef = useRef(type)

  useEffect(() => {
    typeRef.current = type
  }, [type])

  const requestKey = `${type}|${attempt}`
  const loading = loadedKey !== requestKey

  const summary = useMemo(
    () => ({
      total: items.length,
      hidden: items.filter((item) => item.hidden).length,
    }),
    [items],
  )

  useEffect(() => {
    let active = true

    adminModerationService
      .list(type)
      .then((dtos) => {
        if (!active) return
        setItems(adaptAdminContentItems(dtos))
        setError(null)
        setLoadedKey(requestKey)
      })
      .catch((cause: unknown) => {
        if (!active) return
        const apiError = cause instanceof ApiError ? cause : null
        setItems([])
        setError(apiError?.message ?? LOAD_ERROR)
        setLoadedKey(requestKey)
      })

    return () => {
      active = false
    }
  }, [type, requestKey])

  const reload = useCallback(() => {
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  const setItemHidden = useCallback(
    async (
      item: AdminContentItem,
      hidden: boolean,
    ): Promise<ModerationActionResult> => {
      if (pending[item.id]) {
        return { ok: false, message: BUSY_MESSAGE }
      }

      const actionType = type
      const previousHidden = item.hidden
      setPending((current) => ({ ...current, [item.id]: true }))
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, hidden } : entry,
        ),
      )

      try {
        const dto = await adminModerationService.setHidden(
          actionType,
          item.id,
          hidden,
        )
        const adapted = adaptAdminContentItem(dto)

        if (typeRef.current === actionType) {
          setItems((current) =>
            current.map((entry) =>
              entry.id === item.id ? { ...entry, hidden: adapted.hidden } : entry,
            ),
          )
          setAnnouncement(
            hidden
              ? `${item.name} is now hidden from public pages.`
              : `${item.name} is visible again.`,
          )
        }

        return { ok: true }
      } catch (cause) {
        if (typeRef.current === actionType) {
          setItems((current) =>
            current.map((entry) =>
              entry.id === item.id
                ? { ...entry, hidden: previousHidden }
                : entry,
            ),
          )
        }

        return {
          ok: false,
          message: cause instanceof ApiError ? cause.message : ACTION_ERROR,
        }
      } finally {
        setPending((current) => {
          const next = { ...current }
          delete next[item.id]
          return next
        })
      }
    },
    [pending, type],
  )

  return {
    items,
    summary,
    loading,
    error,
    empty: !loading && !error && items.length === 0,
    pending,
    announcement,
    reload,
    setItemHidden,
  }
}
