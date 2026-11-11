---
id: BE-20
title: Admin — overview summary, users, orders, auctions
status: review
depends_on: [BE-12, BE-14, BE-17, BE-18]
contracts: [CT-18, CT-22, CT-23, CT-24]
scope: §2 global dashboard
owns:
  - apps/api/src/modules/admin/admin-overview.*
  - apps/api/src/modules/admin/admin-lists.*
  - apps/api/src/modules/admin/admin.routes.ts
verify: cd apps/api && npm run typecheck && npm test
---
Four read-only endpoints; no admin endpoint here changes anything.

## Build
- `GET /api/admin/summary` (CT-18): counts with `countDocuments`, `byStatus` with one `$group`, `salesPerDay` with the day helper from BE-17 (`lib/days.ts`), non-cancelled orders.
- `GET /api/admin/users?q&role&page` (CT-22), `GET /api/admin/orders?status&page` (CT-23), `GET /api/admin/auctions?status&page` (CT-24): one small `paginate(model, filter, sort, page)` helper in `admin-lists.service.ts`, page size 8, returning `{ items, total }`.

## Server rules
- Sort with a tiebreaker on `_id` so pages are stable. `page` is a positive integer, capped at 10 000.
- `q` is escaped before `$regex`.
- `AdminUser.state`: `pending` for a producer awaiting approval, otherwise `active` (README gap 4). Map to the contract type explicitly: no `passwordHash`, `card`, `cart` or `address`.
- Admin auctions include drafts (this is the only place besides the owner's manager that sees them).

## Done when
- [x] Page 2 of 9 users returns 1 item and `total: 9`; a page past the end returns `[]`
- [x] Unknown `role` / `status` and `page=0` → 400
- [x] Empty database → zeros and empty arrays, not 404
- [x] Non-admin tokens → 403 on all four
- [x] `verify` passes
