import mongoose from 'mongoose'
import { ApiError } from '../../lib/api-error.js'
import { emitToUser } from '../../realtime/emit.js'
import { NotificationModel, type NotificationType } from './notifications.model.js'

export interface NotificationDto {
  id: string
  type: NotificationType
  text: string
  date: string
  read: boolean
}

function toDto(n: InstanceType<typeof NotificationModel>): NotificationDto {
  return { id: String(n._id), type: n.type, text: n.text, date: n.createdAt.toISOString(), read: n.read }
}

export async function notify(userId: string, type: NotificationType, text: string): Promise<NotificationDto> {
  const dto = toDto(await NotificationModel.create({ user: userId, type, text }))
  emitToUser(userId, 'notification', dto)
  return dto
}

export async function listNotifications(userId: string): Promise<NotificationDto[]> {
  const docs = await NotificationModel.find({ user: userId }).sort({ createdAt: -1, _id: -1 }).limit(100)
  return docs.map(toDto)
}

export async function markRead(userId: string, id: string): Promise<void> {
  const found = mongoose.isValidObjectId(id)
    ? await NotificationModel.findOneAndUpdate({ _id: id, user: userId }, { read: true })
    : null
  if (!found) throw new ApiError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found')
}
