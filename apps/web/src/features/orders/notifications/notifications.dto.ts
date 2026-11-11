// API shapes assumed by FE-09. Every field may be missing or renamed later.
// GET /api/notifications → NotificationDto[] ; PATCH /api/notifications/:id { read: true } → 200.
// Realtime `notification` → user:<id>: NotificationDto (CT-00).

export interface NotificationDto {
  id?: string
  _id?: string
  type?: string
  text?: string
  date?: string
  // Defensive aliases: the draft only promises `date`; the API may send `createdAt`.
  createdAt?: string
  read?: boolean
}

export interface MarkNotificationReadRequestDto {
  read: true
}
