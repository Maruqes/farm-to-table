---
id: FE-26
title: Producers directory
status: todo
depends_on: [FE-05]
route: /producers
roles: [visitor, buyer]
scope: "§0 screens (nav: Producers)"
owns:
  - apps/web/src/pages/ProducersPage.tsx
  - apps/web/src/features/producer/producers-directory/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- List of approved, non-hidden producers: name, locality, rating, product count; search by name and filter by locality.
- Each card links to the public producer page (FE-05). Empty-result state.

## Assumed API (draft)
- `GET /api/producers?q&location` → 200 [{id, name, location, averageRating, productCount}]

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
