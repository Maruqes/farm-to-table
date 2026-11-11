---
id: BE-13
title: Reviews — rate an order, producer list, report
status: done
depends_on: [BE-12]
contracts: [CT-04, CT-08, CT-16]
scope: §0 ratings
owns:
  - apps/api/src/modules/reviews/reviews.model.ts
  - apps/api/src/modules/reviews/reviews.schemas.ts
  - apps/api/src/modules/reviews/reviews.service.ts
  - apps/api/src/modules/reviews/reviews.controller.ts
  - apps/api/src/modules/reviews/reviews.routes.ts
  - apps/api/src/modules/reviews/reviews.test.ts
  - apps/api/src/modules/orders/orders.service.ts
  - apps/api/src/modules/products/products.service.ts
verify: cd apps/api && npm run typecheck && npm test
---
Uses the per-order rule in README gap 5.

## Build
- `reviews.model.ts`: `order` (**unique index**), `buyer`, `producer` (indexed), `products` (ids from the order lines), `productName` (set when the order has one line), `rating`, `text`, `hidden`, `report` (`reason`, `reportedAt`, `open`), timestamps.
- `POST /api/reviews` (buyer, CT-08), `GET /api/reviews?producer=me` and `POST /api/reviews/:id/report` (approved producer, CT-16).
- Export `recomputeRatings(producerId, productIds)`: averages non-hidden reviews into `averageRating` / `ratingCount` on the producer and each product. Called here on create, and by BE-19 on hide/keep.
- Fill `reviewed` / `review` in `GET /api/orders/mine` and `reviews` in `GET /api/products/:id` (non-hidden, newest first, cap 50).

## Server rules
- The order must match `{ _id: orderId, buyer: sub }` (else 404 `ORDER_NOT_FOUND`) and be `delivered` (409 `ORDER_NOT_DELIVERED`). Buyer, producer and products are taken from the order, never from the body.
- One review per order is enforced by the unique index: catch the duplicate-key error → 409 `ALREADY_REVIEWED`. No check-then-insert.
- `text` is trimmed, max 500, stored as plain text. `author` in responses is the buyer's display name only.
- Report filters by `{ _id, producer: sub }` (403 for another producer's review, 404 `REVIEW_NOT_FOUND` for unknown). Idempotent; a second report does not overwrite the first reason.

## Done when
- [x] Rating twice (also in parallel) gives exactly one review and one 409
- [x] A buyer cannot rate another buyer's order or an undelivered one
- [x] Averages on the product and producer change after a review
- [x] A producer cannot report another producer's review
- [x] `verify` passes
