---
id: FE-09
title: Notification toasts
status: done
depends_on: [FE-00, FE-08]
route: (global)
roles: [buyer, producer]
scope: §0 notifications, §4
owns:
  - apps/web/src/components/Notifications*.tsx
  - apps/web/src/features/orders/notifications/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Global toast listener on the `user:<id>` room: order state changed, new order (producer), auction won or skipped, producer approved / rejected, product hidden.
- Unread list (bell dropdown) with mark-as-read; mock emitter fires sample events.
- No page: mount the listener in the shell (the one shell edit this ticket may make).

## Assumed API (draft)
- `GET /api/notifications` → 200 [{id, type, text, date, read}]
- `PATCH /api/notifications/:id` {read:true} → 200
- socket `notification` on `user:<id>`

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard (n/a: global, role gate inside `Notifications.tsx`)
- [x] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
