// Domain model consumed by components and hooks. API shapes stay in notifications.dto.ts.

export type NotificationType =
  | 'order-status-changed'
  | 'order-new'
  | 'auction-won'
  | 'auction-skipped'
  | 'producer-approved'
  | 'producer-rejected'
  | 'product-hidden'

export interface UserNotification {
  id: string
  type: NotificationType
  text: string
  date: string | null
  read: boolean
}

export type NotificationActionResult =
  | { ok: true }
  | { ok: false; message: string }
