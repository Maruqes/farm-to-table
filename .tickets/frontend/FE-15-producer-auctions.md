---
id: FE-15
title: Producer auction manager
status: review
depends_on: [FE-11, FE-13]
route: /producer/auctions
roles: [producer]
scope: §0 auction rules, §3
owns:
  - apps/web/src/pages/ProducerAuctionsPage.tsx
  - apps/web/src/features/producer/producer-auctions/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- List by state (`draft`, `scheduled`, `active`, `ended`).
- Create form: product, lot quantity, base price, minimum increment, duration (15 min / 30 min / 1 h / custom), start time; save as draft or publish.
- Cancel allowed only before the first bid; link to the live room.

## Assumed API (draft)
- `GET /api/auctions?producer=me`, `POST /api/auctions` → 201, `PUT /api/auctions/:id` (draft only), `POST /api/auctions/:id/publish`, `POST /api/auctions/:id/cancel` → 200; 409 if bids exist

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [x] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
