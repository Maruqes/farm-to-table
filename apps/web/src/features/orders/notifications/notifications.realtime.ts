import { USE_MOCKS } from '@/services/env'
import { createRealtimeClient, userRoom } from '@/services/realtime'
import type { NotificationDto } from './notifications.dto'
import { createLiveNotification, mockRoleFor } from './mocks/notifications'

// Real time behind a small client interface: the mock emits sample notifications on a
// timer; the HTTP implementation listens on the socket `notification` event.

export interface NotificationsRealtime {
  subscribe(userId: string, onNotification: (dto: NotificationDto) => void): () => void
}

const FIRST_EVENT_MS = 4500
const EVENT_INTERVAL_MS = 14000

function subscribeMock(
  userId: string,
  onNotification: (dto: NotificationDto) => void,
): () => void {
  const role = mockRoleFor(userId)
  let sequence = 0
  let interval: ReturnType<typeof setInterval> | null = null

  const first = setTimeout(() => {
    sequence += 1
    onNotification(createLiveNotification(sequence, role))
    interval = setInterval(() => {
      sequence += 1
      onNotification(createLiveNotification(sequence, role))
    }, EVENT_INTERVAL_MS)
  }, FIRST_EVENT_MS)

  return () => {
    clearTimeout(first)
    if (interval) clearInterval(interval)
  }
}

function subscribeSocket(
  userId: string,
  onNotification: (dto: NotificationDto) => void,
): () => void {
  const client = createRealtimeClient()
  const room = userRoom(userId)
  client.join(room)
  const unsubscribe = client.on<NotificationDto>('notification', onNotification)

  return () => {
    unsubscribe()
    client.leave(room)
    client.disconnect()
  }
}

export function createNotificationsRealtime(): NotificationsRealtime {
  return { subscribe: USE_MOCKS ? subscribeMock : subscribeSocket }
}
