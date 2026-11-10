---
id: FE-07
title: Checkout
status: todo
depends_on: [FE-06]
route: /checkout
roles: [buyer]
scope: §0 order rules
owns:
  - apps/web/src/pages/CheckoutPage.tsx
  - apps/web/src/features/cart/checkout/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Pickup or delivery (address form); payment is on pickup/delivery, no card here.
- Summary shows that the cart splits into one order per producer.
- Success page listing created orders; stock-conflict error.

## Assumed API (draft)
- `POST /api/orders` {fulfilment: pickup|delivery, address?} → 201 [{id, producer, status:"pending", items, total}]; 400 / 409

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
