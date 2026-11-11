---
id: FE-17
title: Edit public page
status: done
depends_on: [FE-05]
route: /producer/page
roles: [producer]
scope: §0 producer screens, §1 maps
owns:
  - apps/web/src/pages/ProducerPageEditPage.tsx
  - apps/web/src/features/producer/producer-page-edit/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Form: bio, locality, photo, lat/lng (click-on-map picker). Live preview of the public page.

## Assumed API (draft)
- `PUT /api/producers/me` {bio, location, lat, lng, photoUrl} → 200; 400

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [x] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
