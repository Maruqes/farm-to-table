---
id: FE-12
title: Producer dashboard
status: todo
depends_on: [FE-01, FE-02]
route: /producer
roles: [producer]
scope: §0 producer screens, §2
owns:
  - apps/web/src/pages/ProducerDashboardPage.tsx
  - apps/web/src/features/producer/producer-dashboard/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- "Your live auction" card (current price, bids, watchers) with a "follow live" link to the room, shown only when one is running; low-stock list links to "Restock" (FE-13).
- Counters: sales, orders to handle, active products, average rating.
- Charts: sales over time, orders by state. Low-stock list.
- Updates live when an order arrives.

## Assumed API (draft)
- stats also carry `activeAuction?: {id, product, currentPrice, bidCount, viewers}`
- `GET /api/producers/me/stats` → 200 {sales, toHandle, activeProducts, averageRating, salesPerDay:[{day,total}], byStatus:{...}, lowStock:[...]}

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
