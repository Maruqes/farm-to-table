import type { NotificationDto } from './notifications.dto'
import type { NotificationType, UserNotification } from './notifications.types'

const NOTIFICATION_TYPES: NotificationType[] = [
  'order-status-changed',
  'order-new',
  'auction-won',
  'auction-skipped',
  'producer-approved',
  'producer-rejected',
  'product-hidden',
]

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function asDate(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  return Number.isNaN(Date.parse(value)) ? null : value
}

function asType(value: unknown): NotificationType | null {
  return NOTIFICATION_TYPES.includes(value as NotificationType)
    ? (value as NotificationType)
    : null
}

export function adaptNotification(
  dto: NotificationDto | null | undefined,
  index = 0,
): UserNotification | null {
  const type = asType(dto?.type)
  const text = asString(dto?.text)
  if (!type || !text) return null

  return {
    id: asString(dto?.id || dto?._id, `notification-${index + 1}`),
    type,
    text,
    date: asDate(dto?.date ?? dto?.createdAt),
    read: dto?.read === true,
  }
}

export function adaptNotifications(
  dto: NotificationDto[] | null | undefined,
): UserNotification[] {
  const raw = Array.isArray(dto) ? dto : []
  return raw
    .map((notification, index) => adaptNotification(notification, index))
    .filter((notification): notification is UserNotification => notification !== null)
}
