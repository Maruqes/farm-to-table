---
id: BE-06
title: Producer product manager — own list, create, update, delete
status: done
depends_on: [BE-05]
contracts: [CT-13]
scope: §0 producer, §6
owns:
  - apps/api/src/modules/products/products.schemas.ts
  - apps/api/src/modules/products/products.service.ts
  - apps/api/src/modules/products/products.controller.ts
  - apps/api/src/modules/products/products.routes.ts
  - apps/api/src/modules/products/producer-products.test.ts
verify: cd apps/api && npm run typecheck && npm test
---
Blocked until CT-13 is `done` (README gap 1).

## Build
`GET /api/products?producer=me`, `POST /api/products` (201 + `Location`), `PUT /api/products/:id`, `DELETE /api/products/:id`, all for an approved producer.

## Server rules
- `producer=me` switches `GET /api/products` to the authenticated branch (guards applied inside the route, since the same path is public otherwise). It returns all own products, including hidden and out of stock.
- The owner is the token's `sub` on create; `producer`, `hidden`, `averageRating` and `imageKey` in a body are ignored.
- Update and delete filter by `{ _id, producer: sub }`. To tell 403 from 404 as CT-13 requires, look the id up once more only when that filter matched nothing.
- Delete → 409 `PRODUCT_IN_AUCTION` when a `scheduled` or `active` auction uses the product (the check lives in the auctions service once BE-14 exists; a stub returning false until then).
- Deleting a product must not break old orders (lines are copies, BE-11) and removes it from every cart on the next cart read (BE-08 handles missing products).

## Done when
- [x] A producer cannot read, change or delete another producer's product (403, tested)
- [x] Pending producer → 403 `PRODUCER_NOT_APPROVED`; buyer → 403 `FORBIDDEN`
- [x] A created product appears in the public catalog with the right producer
- [x] `verify` passes
