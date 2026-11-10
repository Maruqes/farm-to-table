---
id: FE-03
title: Home and catalog
status: done
depends_on: [FE-00]
route: /
roles: [visitor, buyer]
scope: §0 catalog rules, §2
owns:
  - apps/web/src/pages/HomePage.tsx
  - apps/web/src/features/catalog/home-catalog/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Reads `q` and `producer` from the URL (header search and the producer page's "See all" link use them).
- Highlight strip of live auctions (links to the room); hidden when none.
- Search box (name / ingredient / producer), filters (category, locality, season, organic), sort (price, rating), product grid with price, producer and rating.
- Only buyable products shown; empty-result state with "clear filters".

## Assumed API (draft)
- `GET /api/products?q&category&location&season&organic&producer&sort` → 200 [{id, name, price, unit, stock, category, imageUrl, producer:{id,name,location}, averageRating}]
- `GET /api/auctions?status=active&limit=3` → 200 [{id, product, currentPrice, endsAt}]

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
