---
id: FE-27
title: Auctions list
status: todo
depends_on: [FE-11]
route: /auctions
roles: [visitor, buyer]
scope: "§0 auction rules (nav: Auctions)"
owns:
  - apps/web/src/pages/AuctionsPage.tsx
  - apps/web/src/features/auctions/auctions-list/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Tabs: live (`active`), scheduled (`scheduled`), ended (`ended`); each card shows product, current price, countdown, watchers; links to the room (FE-11).
- The nav "Auctions" badge shows the live count (the one nav-component edit this ticket may make).
- Empty state per tab.

## Assumed API (draft)
- `GET /api/auctions?status` → 200 [{id, product, currentPrice, endsAt, viewers, status}]

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
