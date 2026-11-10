import { USE_MOCKS } from '@/services/env'
import type { UserNotification } from './notifications.types'
import { notificationsHttpService } from './notifications.http'
import { notificationsMockService } from './notifications.mock'

export interface NotificationsService {
  list(userId: string): Promise<UserNotification[]>
  markRead(userId: string, id: string): Promise<void>
}

export const notificationsService: NotificationsService = USE_MOCKS
  ? notificationsMockService
  : notificationsHttpService
