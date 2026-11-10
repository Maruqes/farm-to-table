---
id: FE-10
title: Profile and mock card
status: todo
depends_on: [FE-01]
route: /profile
roles: [buyer, producer]
scope: §0 auction payment, §3
owns:
  - apps/web/src/pages/ProfilePage.tsx
  - apps/web/src/features/auth/profile/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Edit name, email, address. Buyers also get a mock card form: number, holder, expiry, and a "simulate invalid card" checkbox.
- Card number check (4×4 digits / Luhn) shown inline.

## Assumed API (draft)
- `GET /api/users/me`, `PUT /api/users/me` → 200
- `PUT /api/users/me/card` {number, holder, expiry, simulateInvalid} → 200; 400

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
