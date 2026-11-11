import mongoose from 'mongoose'

export const NOTIFICATION_TYPES = [
  'order-status-changed',
  'order-new',
  'auction-won',
  'auction-skipped',
  'producer-approved',
  'producer-rejected',
  'product-hidden',
] as const
export type NotificationType = (typeof NOTIFICATION_TYPES)[number]

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const NotificationModel = mongoose.model('Notification', notificationSchema)
