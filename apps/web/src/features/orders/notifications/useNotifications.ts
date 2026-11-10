import { useCallback, useEffect, useRef, useState } from 'react'
import { useSession } from '@/context/session'
import { ApiError } from '@/services/api'
import { adaptNotification } from './notifications.adapter'
import type { NotificationDto } from './notifications.dto'
import { createNotificationsRealtime } from './notifications.realtime'
import { notificationsService } from './notifications.service'
import type { NotificationActionResult, UserNotification } from './notifications.types'

const LOAD_ERROR = 'Your notifications could not be loaded. Check your connection and try again.'
const MARK_ERROR = 'This notification could not be marked as read. Check your connection and try again.'
const MARK_ALL_ERROR = 'Some notifications could not be marked as read. Check your connection and try again.'

function errorMessage(cause: unknown, fallback: string): string {
  return cause instanceof ApiError ? cause.message : fallback
}

function mergeNotifications(
  current: UserNotification[],
  incoming: UserNotification[],
): UserNotification[] {
  const incomingIds = new Set(incoming.map((notification) => notification.id))
  const liveOnly = current.filter((notification) => !incomingIds.has(notification.id))
  return [...liveOnly, ...incoming]
}

export function useNotifications() {
  const { user } = useSession()
  const userId = user?.id ?? ''

  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [loading, setLoading] = useState(userId !== '')
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [latest, setLatest] = useState<UserNotification | null>(null)

  const notificationsRef = useRef<UserNotification[]>([])

  useEffect(() => {
    notificationsRef.current = notifications
  }, [notifications])

  useEffect(() => {
    if (!userId) return

    let active = true

    notificationsService
      .list(userId)
      .then((result) => {
        if (!active) return
        setNotifications((current) => mergeNotifications(current, result))
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause, LOAD_ERROR))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [userId, attempt])

  useEffect(() => {
    if (!userId) return

    const realtime = createNotificationsRealtime()
    const unsubscribe = realtime.subscribe(userId, (dto: NotificationDto) => {
      const notification = adaptNotification(dto)
      if (!notification) return

      setNotifications((current) =>
        current.some((entry) => entry.id === notification.id)
          ? current
          : [notification, ...current],
      )
      setLatest(notification)
    })

    return unsubscribe
  }, [userId])

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    setAttempt((value) => value + 1)
  }, [])

  const markRead = useCallback(
    async (id: string): Promise<NotificationActionResult> => {
      const target = notificationsRef.current.find((notification) => notification.id === id)
      if (!target || target.read) return { ok: true }
      if (!userId) {
        return { ok: false, message: 'Your session has expired. Sign in again to continue.' }
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification,
        ),
      )

      try {
        await notificationsService.markRead(userId, id)
        return { ok: true }
      } catch (cause) {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === id ? { ...notification, read: false } : notification,
          ),
        )
        return { ok: false, message: errorMessage(cause, MARK_ERROR) }
      }
    },
    [userId],
  )

  const markAllRead = useCallback(async (): Promise<NotificationActionResult> => {
    const unreadIds = notificationsRef.current
      .filter((notification) => !notification.read)
      .map((notification) => notification.id)
    if (unreadIds.length === 0) return { ok: true }
    if (!userId) {
      return { ok: false, message: 'Your session has expired. Sign in again to continue.' }
    }

    setNotifications((current) =>
      current.map((notification) =>
        notification.read ? notification : { ...notification, read: true },
      ),
    )

    try {
      const results = await Promise.allSettled(
        unreadIds.map((id) => notificationsService.markRead(userId, id)),
      )
      const failed = results.find(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      )
      if (failed) {
        // No bulk endpoint exists in the draft, so one failed PATCH can leave the rest
        // applied. Reload to accept the server state instead of guessing.
        reload()
        return { ok: false, message: errorMessage(failed.reason, MARK_ALL_ERROR) }
      }
      return { ok: true }
    } catch (cause) {
      reload()
      return { ok: false, message: errorMessage(cause, MARK_ALL_ERROR) }
    }
  }, [reload, userId])

  const unreadCount = notifications.reduce(
    (count, notification) => (notification.read ? count : count + 1),
    0,
  )

  return {
    notifications,
    unreadCount,
    loading,
    error,
    latest,
    reload,
    markRead,
    markAllRead,
  }
}
