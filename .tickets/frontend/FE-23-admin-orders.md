---
id: FE-23
title: All orders
status: done
depends_on: [FE-01]
route: /admin/orders
roles: [admin]
scope: §2 admin
owns:
  - apps/web/src/pages/AdminOrdersPage.tsx
  - apps/web/src/features/admin/admin-orders/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Paginated table of all orders with state filter. Read-only (admin cannot edit orders).

## Assumed API (draft)
- `GET /api/admin/orders?status&page` → 200 {items:[...], total}

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
