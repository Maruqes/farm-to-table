---
id: BE-23
title: Demo data and first full run with mocks off
status: review
depends_on: [BE-22]
contracts: [CT-00 … CT-27]
scope: §0 typical flows, §9 M2
owns:
  - apps/api/src/db/seed.ts
  - apps/api/src/db/seed-data.ts
  - .tickets/backend/INTEGRATION.md
verify: cd apps/api && npm run typecheck && npm test && npm run seed
---
The backend's exit check. It finds mismatches; it does not rewrite the web app.

## Build
- Extend the seed (still idempotent): about 6 approved producers with pages and coordinates, 30 products across all categories, a few delivered orders with reviews (one reported), one `scheduled` and one `active` auction with bids, one pending producer. Reuse the realistic names already in the web fixtures.
- Run the stack with `VITE_USE_MOCKS=false` and walk the three flows of SCOPE.md §0 (buy something, become a producer, run an auction) plus every admin page, at least once each.
- Write `.tickets/backend/INTEGRATION.md`: one line per page in `.tickets/frontend/ROUTES.md` with `ok` or the exact mismatch (endpoint, field, expected vs received).

## Server rules
- A mismatch where the API breaks its contract is fixed here, in the owning module, with a test.
- A mismatch where the contract or the web is wrong is **not** patched: list it in INTEGRATION.md for a contract ticket or the per-feature mock swap that follows. Check README gap 7 (`cancelled` on the buyer page) explicitly.
- The seed never runs automatically in production and never deletes existing data.

## Done when
- [x] All three flows complete end to end against the real API, including a live bid seen in two browsers and an auction closing into an order
- [x] INTEGRATION.md covers every route
- [x] `verify` passes
