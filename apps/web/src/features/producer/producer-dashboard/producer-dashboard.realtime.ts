import { createNotificationsRealtime } from '@/features/orders/notifications/notifications.realtime'
import { USE_MOCKS } from '@/services/env'
import { addMockDashboardOrder } from './mocks/store'

// Reuses the notification realtime channel: a new order or an order state change
// makes the dashboard refetch its server-owned stats.
export interface ProducerDashboardRealtime {
  subscribe(userId: string, onOrderChange: () => void): () => void
}

export function createProducerDashboardRealtime(): ProducerDashboardRealtime {
  return {
    subscribe(userId, onOrderChange) {
      const realtime = createNotificationsRealtime()

      return realtime.subscribe(userId, (notification) => {
        if (
          notification.type !== 'order-new' &&
          notification.type !== 'order-status-changed'
        ) {
          return
        }

        // In mock mode there is no server behind the event, so move the fixture too.
        if (USE_MOCKS && notification.type === 'order-new') addMockDashboardOrder()
        onOrderChange()
      })
    },
  }
}
