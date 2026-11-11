import { ApiError } from '@/services/api'
import { adaptNotifications } from './notifications.adapter'
import type { NotificationDto } from './notifications.dto'
import type { NotificationsService } from './notifications.service'
import type { UserNotification } from './notifications.types'
import { createMockNotifications } from './mocks/notifications'

const MOCK_LATENCY_MS = 500
const MARK_READ_LATENCY_MS = 250
const READ_STORAGE_PREFIX = 'ftt.notifications.read.'

// Set `ftt.notifications.mock-error` to `1` in the browser to exercise the load error and retry states.
export const MOCK_NOTIFICATIONS_ERROR_KEY = 'ftt.notifications.mock-error'
// Set `ftt.notifications.mock-empty` to `1` in the browser to exercise the empty state.
export const MOCK_NOTIFICATIONS_EMPTY_KEY = 'ftt.notifications.mock-empty'
// Set `ftt.notifications.mock-read-error` to `1` to exercise a failed mark-as-read.
export const MOCK_NOTIFICATIONS_READ_ERROR_KEY = 'ftt.notifications.mock-read-error'

function wait(ms = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function isFlagOn(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1'
  } catch {
    return false
  }
}

function readStorageKey(userId: string): string {
  return `${READ_STORAGE_PREFIX}${userId}`
}

function readStoredIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(readStorageKey(userId))
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

function writeStoredIds(userId: string, ids: Set<string>): void {
  try {
    localStorage.setItem(readStorageKey(userId), JSON.stringify([...ids]))
  } catch {
    // The read flag still applies for this session when storage is unavailable.
  }
}

function withStoredReads(userId: string, notifications: NotificationDto[]): NotificationDto[] {
  const stored = readStoredIds(userId)
  return notifications.map((notification) => {
    const id = notification.id ?? notification._id
    return id && stored.has(id) ? { ...notification, read: true } : notification
  })
}

export const notificationsMockService: NotificationsService = {
  async list(userId: string): Promise<UserNotification[]> {
    await wait()

    if (isFlagOn(MOCK_NOTIFICATIONS_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'Your notifications could not be loaded. Please try again.',
      )
    }
    if (isFlagOn(MOCK_NOTIFICATIONS_EMPTY_KEY)) return []

    return adaptNotifications(withStoredReads(userId, createMockNotifications(userId)))
  },

  async markRead(userId: string, id: string): Promise<void> {
    await wait(MARK_READ_LATENCY_MS)

    if (isFlagOn(MOCK_NOTIFICATIONS_READ_ERROR_KEY)) {
      throw new ApiError(
        500,
        'INTERNAL_ERROR',
        'This notification could not be marked as read. Please try again.',
      )
    }

    const stored = readStoredIds(userId)
    stored.add(id)
    writeStoredIds(userId, stored)
  },
}
