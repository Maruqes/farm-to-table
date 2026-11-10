---
id: FE-18
title: Admin overview
status: todo
depends_on: [FE-01]
route: /admin
roles: [admin]
scope: §2 admin, §0 admin screens
owns:
  - apps/web/src/pages/AdminOverviewPage.tsx
  - apps/web/src/features/admin/admin-overview/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Compact widgets with links to the full pages: pending producers (FE-19), reported reviews (FE-20), live auctions (FE-27 list), service status (FE-25).
- Counters (users, orders, live auctions, pending producers) and charts (orders by state, sales over time).

## Assumed API (draft)
- `GET /api/admin/summary` → 200 {users, orders, activeAuctions, pendingProducers, byStatus:{...}, salesPerDay:[...]}

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
