---
id: BE-17
title: Producer dashboard stats
status: done
depends_on: [BE-12, BE-14]
contracts: [CT-12]
scope: §2 dashboards with charts
owns:
  - apps/api/src/modules/producers/producer-stats.service.ts
  - apps/api/src/modules/producers/producer-stats.test.ts
  - apps/api/src/modules/producers/producers.controller.ts
  - apps/api/src/modules/producers/producers.routes.ts
  - apps/api/src/lib/days.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
`GET /api/producers/me/stats`, approved producer. Register it before `/:id`.

## Server rules
- Every aggregation starts with `$match: { producer: sub }`. There is no producer id parameter.
- Sales = sum of `total` of own orders that are not `cancelled`, created in the last 7 local days (`Europe/Lisbon`, `$dateToString` with `timezone`). `lib/days.ts` returns the 7 day keys so empty days are filled with 0; BE-20 reuses it.
- `toHandle` = own orders `pending` or `confirmed`. `activeProducts` = own products that are buyable. `lowStock` = own non-hidden products with `stock <= 5`, lowest first, cap 20.
- `activeAuction` = own `active` auction ending soonest, `viewers` from `realtime/emit.ts`; `null` when none.
- A producer with no data gets zeros and empty arrays.

## Done when
- [x] Numbers match a small fixture (two orders on different days, one cancelled, one low-stock product)
- [x] Another producer's orders never change the result
- [x] Buyer → 403 `FORBIDDEN`; pending producer → 403 `PRODUCER_NOT_APPROVED`
- [x] `verify` passes
