---
id: BE-19
title: Admin — reported reviews (keep / hide)
status: review
depends_on: [BE-13, BE-18]
contracts: [CT-20]
scope: §0 ratings, §2 moderate reported reviews
owns:
  - apps/api/src/modules/admin/admin-reviews.*
  - apps/api/src/modules/admin/admin.routes.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
`GET /api/admin/reviews?reported=true`, `POST /api/admin/reviews/:id/keep`, `POST /api/admin/reviews/:id/hide` (CT-20), one line added to `admin.routes.ts`.

## Server rules
- The queue = reviews with an open report, plus hidden ones, newest report first, cap 200.
- `keep` closes the report (`report.open = false`); the review stays public. `hide` sets `hidden: true` and closes the report. Both are conditional updates on "still in the queue", else 404 `REVIEW_NOT_FOUND`.
- After `hide`, call `recomputeRatings` (BE-13) so the averages and public lists drop the review. Nobody is notified.
- This ticket reads and writes reviews through the reviews service; add the two functions there rather than importing the model.

## Done when
- [x] A hidden review is gone from `GET /api/products/:id` and the product and producer averages change
- [x] A kept review leaves the queue and stays public
- [x] Non-admin tokens → 403
- [x] `verify` passes
