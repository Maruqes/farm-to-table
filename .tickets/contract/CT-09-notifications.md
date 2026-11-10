---
id: CT-09
title: API contract — notifications
status: done
depends_on: [FE-09]
source: [FE-09, SCOPE.md §0 Notifications, §4]
consumers: [apps/web/src/features/orders/notifications/notifications.http.ts, apps/web/src/features/orders/notifications/notifications.dto.ts]
---
Follows CT-00. All endpoints need a `buyer` or `producer` token (401 `UNAUTHORIZED`, 403 `FORBIDDEN` for other roles). A user only ever sees their own notifications.

## Types
```ts
NotificationType =
  | 'order-status-changed'   // buyer: producer moved their order
  | 'order-new'              // producer: a buyer placed an order
  | 'auction-won'            // buyer: won an auction, order created
  | 'auction-skipped'        // buyer: skipped (card failed), text says why
  | 'producer-approved'      // producer
  | 'producer-rejected'      // producer
  | 'product-hidden'         // producer: admin hid a product or page
Notification = {
  id: string,
  type: NotificationType,
  text: string,      // ready-to-show English sentence
  date: string,      // ISO 8601
  read: boolean
}
```

## GET /api/notifications
Own notifications, newest first.
- 200 `Notification[]` (empty array when none)
- 401, 403

## PATCH /api/notifications/:id
Request `{ read: true }`. Idempotent.
- 200 (body ignored by the client)
- 400 `VALIDATION_ERROR` body not `{ read: true }`
- 401, 403
- 404 `NOTIFICATION_NOT_FOUND` missing or not the caller's

## Realtime `notification` (room `user:<id>`)
Payload: `Notification` (with `read: false`). Emitted when the notification is stored, so it is also in the next `GET`.

## Open
- "Mark all as read" sends one PATCH per unread item; a bulk `PATCH /api/notifications` may be added later via a contract ticket.
- `notification` must be added to CT-00's realtime event list when CT-00 is next revised.
