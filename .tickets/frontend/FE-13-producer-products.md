---
id: FE-13
title: Producer product manager
status: todo
depends_on: [FE-12]
route: /producer/products
roles: [producer]
scope: §0 producer screens, §6
owns:
  - apps/web/src/pages/ProducerProductsPage.tsx
  - apps/web/src/features/producer/producer-products/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Table of own products; create / edit form (name, category, price, unit, stock, season, organic, photo upload); delete with confirm.
- Validation errors; image preview.

## Assumed API (draft)
- `GET /api/products?producer=me`, `POST /api/products` → 201, `PUT /api/products/:id` → 200, `DELETE /api/products/:id` → 204
- `POST /api/products/:id/image` (multipart) → 200 {imageUrl}

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
