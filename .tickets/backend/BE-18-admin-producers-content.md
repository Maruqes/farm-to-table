---
id: BE-18
title: Admin — producer approvals and content moderation
status: review
depends_on: [BE-05, BE-10]
contracts: [CT-19, CT-21, CT-09]
scope: §0 admin, §2 moderate content
owns:
  - apps/api/src/modules/admin/admin.routes.ts
  - apps/api/src/modules/admin/admin-producers.*
  - apps/api/src/modules/admin/admin-content.*
verify: cd apps/api && npm run typecheck && npm test
---
## Build
- `admin.routes.ts`: one router mounted at `/api/admin` whose first line is `router.use(requireAuth, requireRole('admin'))`. Every admin ticket adds its sub-router below that line, so no admin endpoint can be registered unguarded.
- `GET /api/admin/producers?status=pending`, `POST /api/admin/producers/:id/approve`, `POST /api/admin/producers/:id/reject` (CT-19).
- `GET /api/admin/content?type=product|producer`, `PATCH /api/admin/content/:type/:id` (CT-21).

## Server rules
- Approve and reject are one conditional update on `{ _id, role: 'producer', 'producer.status': 'pending' }`; no match → 404 `PRODUCER_NOT_FOUND`. A decided producer cannot be flipped again from here. `reason` is stored on `producer.rejectReason`.
- After the update: `notify(producer, 'producer-approved' | 'producer-rejected', ...)`.
- Content `PATCH` only sets `hidden` on the product or on `producer.hidden`; it can change nothing else. Hiding (not unhiding, and not a no-op) sends `notify(owner, 'product-hidden', ...)`.
- A hidden producer page also removes that producer's products from the public catalog: confirm the BE-05 "buyable" rule covers it, extend it if not.
- `PendingProducer` includes `email` (admin only). `categories` per README gap 3.

## Done when
- [x] Buyer and producer tokens get 403 on every route here; no token gets 401 (tested once per route)
- [x] An approved producer can immediately use producer endpoints with their old token
- [x] Hiding a product removes it from `GET /api/products` and `GET /api/products/:id`; unhiding restores it
- [x] Approving twice → second call 404
- [x] `verify` passes
