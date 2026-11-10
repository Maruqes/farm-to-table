---
id: FE-09
title: Notification toasts
status: todo
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
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
