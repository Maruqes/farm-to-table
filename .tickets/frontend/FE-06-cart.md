---
id: FE-06
title: Cart
status: todo
depends_on: [FE-01, FE-04]
route: /cart
roles: [buyer]
scope: §0 cart
owns:
  - apps/web/src/pages/CartPage.tsx
  - apps/web/src/features/cart/cart/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Lines grouped by producer, quantity edit (capped at stock), remove, totals; empty cart state.
- Cart persists per logged-in buyer (context + service).

## Assumed API (draft)
- `GET /api/cart` → 200 {items:[{productId, name, price, quantity, producer}]}
- `PUT /api/cart` {items} → 200; 409 when stock changed

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
