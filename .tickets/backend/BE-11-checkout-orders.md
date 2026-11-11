---
id: BE-11
title: Orders — checkout and my orders
status: done
depends_on: [BE-08, BE-10]
contracts: [CT-07, CT-08, CT-14]
scope: §0 order and stock rules, §5
owns:
  - apps/api/src/modules/orders/orders.model.ts
  - apps/api/src/modules/orders/orders.schemas.ts
  - apps/api/src/modules/orders/orders.service.ts
  - apps/api/src/modules/orders/orders.controller.ts
  - apps/api/src/modules/orders/orders.routes.ts
  - apps/api/src/modules/orders/orders.test.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
- `orders.model.ts`: `buyer`, `producer` (both indexed refs), embedded `items` (`productId`, `name`, `price`, `quantity`, `unit` copied at purchase), `total`, `status` (incl. `cancelled`), `history` (`status`, `date`), `fulfilment`, `address`, `auction` (optional ref), timestamps.
- `POST /api/orders` (CT-07) and `GET /api/orders/mine` (CT-08), buyer only. `reviewed` / `review` are `false` / absent until BE-13.
- Export `createOrder({ buyer, producer, items, fulfilment, address, auction? })` for BE-16.

## Server rules
- The request carries only `fulfilment` and `address`. Lines, prices and producers come from the server cart and the product documents; the client can send no item or price.
- Stock, without transactions: for each line `updateOne({ _id, stock: { $gte: q } }, { $inc: { stock: -q } })`. If any line fails, add back every decrement already done, create nothing, keep the cart and answer 409 `STOCK_CHANGED`.
- One order per producer, `total` = rounded sum, `history` starts with `pending`. Then clear the cart.
- After each order is saved: emit `order-created` (payload `ProducerOrder`, CT-14) to `user:<producerId>` and `notify(producer, 'order-new', ...)`.
- `GET /orders/mine` filters by `{ buyer: sub }`. Producer `email` may be shown here (the buyer has an order with them); nothing else of the producer account.
- Empty cart → 400 `VALIDATION_ERROR`.

## Done when
- [x] A cart with two producers creates two orders and empties the cart
- [x] Two buyers racing for the last unit: exactly one order is created and stock ends at 0, never negative (tested with parallel requests)
- [x] A failed checkout leaves stock and cart exactly as before
- [x] A later price change does not alter the stored order lines
- [x] `verify` passes
