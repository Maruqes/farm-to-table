---
id: FE-04
title: Product page
status: todo
depends_on: [FE-03]
route: /products/:id
roles: [visitor, buyer]
scope: §0 catalog + ratings
owns:
  - apps/web/src/pages/ProductDetailPage.tsx
  - apps/web/src/features/catalog/product-detail/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Image, description, price, stock, producer link, ratings with comments.
- Add-to-cart with quantity capped at stock; visitors see a "log in to buy" prompt.
- Not found and out-of-stock states.

## Assumed API (draft)
- `GET /api/products/:id` → 200 product + {description, reviews:[{author, rating, text, date}]}; 404

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
