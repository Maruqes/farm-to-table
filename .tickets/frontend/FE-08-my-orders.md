---
id: FE-08
title: My orders and ratings
status: done
depends_on: [FE-07]
route: /orders
roles: [buyer]
scope: §0 order states + ratings
owns:
  - apps/web/src/pages/MyOrdersPage.tsx
  - apps/web/src/features/orders/my-orders/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Order list with a state timeline `pending → confirmed → ready → delivered`, contact and map buttons for the producer.
- "Rate" dialog only on `delivered` orders, once per order; read-only after.
- Live state updates arrive through the realtime stub.

## Assumed API (draft)
- `GET /api/orders/mine` → 200 [{id, status, history:[{status,date}], producer, items, total, reviewed}]
- `POST /api/reviews` {orderId, rating, text} → 201; 409 if already rated
- socket `order-updated` on `user:<id>` {orderId, status}

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [x] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
