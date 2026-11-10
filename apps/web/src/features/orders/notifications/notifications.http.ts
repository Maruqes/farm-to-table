import { api } from '@/services/api'
import { adaptNotifications } from './notifications.adapter'
import type {
  MarkNotificationReadRequestDto,
  NotificationDto,
} from './notifications.dto'
import type { NotificationsService } from './notifications.service'
import type { UserNotification } from './notifications.types'

export const notificationsHttpService: NotificationsService = {
  async list(): Promise<UserNotification[]> {
    const dto = await api<NotificationDto[]>('/notifications')
    return adaptNotifications(dto)
  },

  async markRead(_userId: string, id: string): Promise<void> {
    const body: MarkNotificationReadRequestDto = { read: true }
    await api<unknown>(`/notifications/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
  },
}
