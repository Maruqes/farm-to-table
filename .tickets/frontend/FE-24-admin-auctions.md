---
id: FE-24
title: All auctions
status: done
depends_on: [FE-01]
route: /admin/auctions
roles: [admin]
scope: §2 admin
owns:
  - apps/web/src/pages/AdminAuctionsPage.tsx
  - apps/web/src/features/admin/admin-auctions/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Live and recent auctions with state, price, bid count; link to the room. Read-only.

## Assumed API (draft)
- `GET /api/admin/auctions?status&page` → 200 {items:[...], total}

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
