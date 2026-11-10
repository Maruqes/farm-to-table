---
id: FE-14
title: Producer orders table
status: review
depends_on: [FE-08]
route: /producer/orders
roles: [producer]
scope: §0 order states, §4
owns:
  - apps/web/src/pages/ProducerOrdersPage.tsx
  - apps/web/src/features/producer/producer-orders/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Table of orders containing this producer's products; state dropdown allows only the next state; cancel only while `pending`.
- Rows update live, including from another tab.

## Assumed API (draft)
- `GET /api/orders?producer=me` → 200 [...]
- `PATCH /api/orders/:id/status` {status} → 200; 400 / 403 on invalid transition
- socket `order-updated`, `order-created` on `user:<id>`

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [x] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
