---
id: FE-20
title: Reported reviews
status: todo
depends_on: [FE-01]
route: /admin/reviews
roles: [admin]
scope: §0 ratings, §2
owns:
  - apps/web/src/pages/AdminReviewsPage.tsx
  - apps/web/src/features/admin/admin-reviews/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Queue of reported reviews with reason; keep or hide. Hidden reviews are marked.

## Assumed API (draft)
- `GET /api/admin/reviews?reported=true` → 200 [...]
- `POST /api/admin/reviews/:id/keep` and `/hide` → 200

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
