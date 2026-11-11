import type { NotificationType } from './notifications.types'

// One shared map for every notification type, as DESIGN.md requires.
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  'order-status-changed': 'Order update',
  'order-new': 'New order',
  'auction-won': 'Auction won',
  'auction-skipped': 'Auction payment failed',
  'producer-approved': 'Producer approved',
  'producer-rejected': 'Producer rejected',
  'product-hidden': 'Product hidden',
}
