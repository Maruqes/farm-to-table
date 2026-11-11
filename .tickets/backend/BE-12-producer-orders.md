---
id: BE-12
title: Producer orders — list and status changes
status: done
depends_on: [BE-11]
contracts: [CT-00, CT-08, CT-14]
scope: §0 order states, §4
owns:
  - apps/api/src/modules/orders/orders.schemas.ts
  - apps/api/src/modules/orders/orders.service.ts
  - apps/api/src/modules/orders/orders.controller.ts
  - apps/api/src/modules/orders/orders.routes.ts
  - apps/api/src/modules/orders/producer-orders.test.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
`GET /api/orders?producer=me` and `PATCH /api/orders/:id/status`, approved producer only. `GET /api/orders` without `producer=me` → 400.

## Server rules
- The list filters by `{ producer: sub }`. The buyer block exposes `id`, `name`, `email` only.
- Transition, atomic: `findOneAndUpdate({ _id, producer: sub, status: <expected previous> }, { $set: { status }, $push: { history } })`. Allowed: `pending→confirmed→ready→delivered`, and `pending→cancelled`. When it matches nothing, read the order once to answer 404 `ORDER_NOT_FOUND`, 403 `FORBIDDEN` (other producer) or 400 `INVALID_STATUS_TRANSITION`.
- `cancelled` returns each line's quantity to stock (`$inc`), skipping products that no longer exist. Orders created by an auction (BE-16) return the lot quantity the same way.
- After a successful change: emit `order-updated` (`{ orderId, status, updatedAt }`, CT-00) to `user:<buyerId>` **and** `user:<producerId>`, and `notify(buyer, 'order-status-changed', ...)`.

## Done when
- [x] Skipping a step, going backwards and cancelling after `pending` all answer 400 and change nothing
- [x] Two parallel `confirmed` requests: one 200, one 400; history has one entry
- [x] Another producer's order → 403; a buyer token → 403
- [x] Cancelling restores stock; buyer and producer sockets both get `order-updated`
- [x] `verify` passes
