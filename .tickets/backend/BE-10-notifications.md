---
id: BE-10
title: Notifications — store, list, mark read, live event
status: done
depends_on: [BE-09]
contracts: [CT-09]
scope: §0 notifications
owns:
  - apps/api/src/modules/notifications/**
verify: cd apps/api && npm run typecheck && npm test
---
## Build
- `notifications.model.ts`: `user` (indexed), `type` (CT-09 enum), `text`, `read`, `createdAt`.
- `GET /api/notifications` (newest first, cap 100) and `PATCH /api/notifications/:id`, buyer and producer only.
- `notify(userId, type, text)` in the service: stores the document, then emits `notification` to `user:<id>` with the stored `Notification`. This is the only way any module creates a notification.

## Server rules
- Both queries filter by `{ user: sub }`; another user's id gives 404 `NOTIFICATION_NOT_FOUND`, never 403 (do not confirm it exists).
- `PATCH` body must be exactly `{ read: true }`; it is idempotent.
- `text` is built by the server from its own data; no client string is stored unescaped as a ready-made sentence except names, and the web renders it as text.

## Done when
- [x] `notify` stores the document and the connected socket receives the same payload
- [x] A user cannot list or mark another user's notification
- [x] Admin token → 403
- [x] `verify` passes
