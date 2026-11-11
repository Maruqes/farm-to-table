---
id: FE-05
title: Public producer page
status: done
depends_on: [FE-03]
route: /producers/:id
roles: [visitor, buyer]
scope: §0 screens, §1 maps
owns:
  - apps/web/src/pages/ProducerPublicPage.tsx
  - apps/web/src/features/producer/producer-public/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Bio, rating, Leaflet + OpenStreetMap map with a single pin from lat/lng, product list.
- Hidden / not found state (admin can hide the page).

## Assumed API (draft)
- `GET /api/producers/:id` → 200 {id, name, bio, location, lat, lng, averageRating, products:[...]}; 404

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
