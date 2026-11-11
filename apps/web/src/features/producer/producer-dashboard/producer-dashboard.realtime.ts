import { createNotificationsRealtime } from '@/features/orders/notifications/notifications.realtime'
import type { NotificationDto } from '@/features/orders/notifications/notifications.dto'
import { USE_MOCKS } from '@/services/env'
import { createRealtimeClient, userRoom } from '@/services/realtime'
import { addMockDashboardOrder } from './mocks/store'

// A new order or an order state change makes the dashboard refetch its
// server-owned stats. In socket mode the server sends `notification` only when
// an order is created, so the page also listens to `order-updated` (a status
// change made in another producer tab must refresh this one too).
export interface ProducerDashboardRealtime {
  subscribe(userId: string, onOrderChange: () => void): () => void
}

function isOrderNotification(notification: NotificationDto): boolean {
  return notification.type === 'order-new' || notification.type === 'order-status-changed'
}

function subscribeSocket(userId: string, onOrderChange: () => void): () => void {
  const client = createRealtimeClient()
  const room = userRoom(userId)
  client.join(room)

  const offOrderUpdated = client.on('order-updated', () => onOrderChange())
  const offNotification = client.on<NotificationDto>('notification', (notification) => {
    if (isOrderNotification(notification)) onOrderChange()
  })

  return () => {
    offOrderUpdated()
    offNotification()
    client.leave(room)
    client.disconnect()
  }
}

function subscribeMock(userId: string, onOrderChange: () => void): () => void {
  const realtime = createNotificationsRealtime()

  return realtime.subscribe(userId, (notification) => {
    if (!isOrderNotification(notification)) return

    // In mock mode there is no server behind the event, so move the fixture too.
    if (notification.type === 'order-new') addMockDashboardOrder()
    onOrderChange()
  })
}

export function createProducerDashboardRealtime(): ProducerDashboardRealtime {
  return {
    subscribe(userId, onOrderChange) {
      return USE_MOCKS
        ? subscribeMock(userId, onOrderChange)
        : subscribeSocket(userId, onOrderChange)
    },
  }
}
