import type { NotificationDto } from '../notifications.dto'

export type MockNotificationRole = 'buyer' | 'producer'

// The mock API has no token, so the role is inferred from the seeded user id.
export function mockRoleFor(userId: string): MockNotificationRole {
  return userId.includes('producer') ? 'producer' : 'buyer'
}

const BUYER_NOTIFICATIONS: NotificationDto[] = [
  {
    id: 'ntf-buyer-1',
    type: 'order-status-changed',
    text: 'Quinta do Vale marked your order as ready. Bring your bags for pickup at the farm.',
    date: '2026-11-10T09:20:00.000Z',
    read: false,
  },
  {
    id: 'ntf-buyer-2',
    type: 'auction-won',
    text: 'You won the kiwi lot from Herdade do Sol for €86.00. Your order is on its way.',
    date: '2026-11-09T17:45:00.000Z',
    read: false,
  },
  {
    id: 'ntf-buyer-3',
    type: 'auction-skipped',
    text: 'Your card was declined for the honey lot, so the next bidder was charged instead.',
    date: '2026-11-08T11:10:00.000Z',
    read: true,
  },
  {
    id: 'ntf-buyer-4',
    type: 'order-status-changed',
    text: 'Quinta do Vale confirmed your order and started preparing it.',
    date: '2026-11-07T08:30:00.000Z',
    read: true,
  },
]

const PRODUCER_NOTIFICATIONS: NotificationDto[] = [
  {
    id: 'ntf-producer-1',
    type: 'order-new',
    text: 'New order from Ana Silva: 3 kg of kiwi and 2 jars of honey.',
    date: '2026-11-10T08:05:00.000Z',
    read: false,
  },
  {
    id: 'ntf-producer-2',
    type: 'product-hidden',
    text: 'An admin hid your product “Serra cheese” after a content review.',
    date: '2026-11-09T15:20:00.000Z',
    read: false,
  },
  {
    id: 'ntf-producer-3',
    type: 'producer-approved',
    text: 'Your producer page was approved. Your products now appear in the catalog.',
    date: '2026-11-06T10:00:00.000Z',
    read: true,
  },
  {
    id: 'ntf-producer-4',
    type: 'order-new',
    text: 'New order from Tomás Rocha: 1 kg of walnuts and a rye loaf.',
    date: '2026-11-05T18:40:00.000Z',
    read: true,
  },
]

export function createMockNotifications(userId: string): NotificationDto[] {
  const role = mockRoleFor(userId)
  const source = role === 'producer' ? PRODUCER_NOTIFICATIONS : BUYER_NOTIFICATIONS
  return source.map((notification) => ({ ...notification }))
}

const LIVE_NOTIFICATIONS: Record<MockNotificationRole, NotificationDto[]> = {
  buyer: [
    {
      type: 'order-status-changed',
      text: 'Quinta do Vale marked your order as ready. Pick it up today at the farm.',
    },
    {
      type: 'auction-won',
      text: 'You won the kiwi lot from Herdade do Sol for €86.00.',
    },
    {
      type: 'auction-skipped',
      text: 'Your card was declined for the honey lot, so the next bidder was charged.',
    },
  ],
  producer: [
    {
      type: 'order-new',
      text: 'New order from Ana Silva: 3 kg of kiwi and 2 jars of honey.',
    },
    {
      type: 'product-hidden',
      text: 'An admin hid your product “Serra cheese” after a content review.',
    },
    {
      type: 'producer-approved',
      text: 'Your producer page was approved. Your products now appear in the catalog.',
    },
    {
      type: 'producer-rejected',
      text: 'Your producer page was sent back for review. Check the notes and submit it again.',
    },
  ],
}

export function createLiveNotification(
  sequence: number,
  role: MockNotificationRole,
  now = new Date(),
): NotificationDto {
  const source = LIVE_NOTIFICATIONS[role]
  const template = source[(sequence - 1) % source.length]
  return {
    id: `live-${role}-${sequence}`,
    type: template.type,
    text: template.text,
    date: now.toISOString(),
    read: false,
  }
}
