---
id: FE-16
title: Reviews received
status: todo
depends_on: [FE-08]
route: /producer/reviews
roles: [producer]
scope: §0 ratings
owns:
  - apps/web/src/pages/ProducerReviewsPage.tsx
  - apps/web/src/features/producer/producer-reviews/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Reviews on own products and page; average; "Report" action with a reason.

## Assumed API (draft)
- `GET /api/reviews?producer=me` → 200 [{id, author, rating, text, product, reported}]
- `POST /api/reviews/:id/report` {reason} → 200

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
