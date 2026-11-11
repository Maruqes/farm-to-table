---
id: BE-08
title: Cart
status: done
depends_on: [BE-05]
contracts: [CT-06]
scope: §0 cart rules
owns:
  - apps/api/src/modules/cart/**
verify: cd apps/api && npm run typecheck && npm test
---
## Build
`GET /api/cart` and `PUT /api/cart`, buyer only. The cart is `users.cart` (README); no cart collection.

## Server rules
- `PUT` replaces the whole cart. Validate at most 50 lines, integer quantity 1..1000, and merge duplicate `productId`s by rejecting them (400).
- Every product must be buyable per the BE-05 rule, else 404 `PRODUCT_NOT_FOUND`. Any quantity above current stock → 409 `STOCK_CHANGED` and nothing is saved.
- Name, price, stock and producer in the response are read from the product at request time; the cart stores only `product` and `quantity`. The client cannot set a price.
- `GET` silently drops lines whose product is gone or no longer buyable, and clamps nothing else: a quantity now above stock is returned as stored, with the current `stock`, so the page can show it.
- Export `getCartLines(userId)` and `clearCart(userId)` for BE-11.

## Done when
- [x] Producer and admin tokens get 403; no token gets 401
- [x] One buyer can never read or write another buyer's cart (no id in the path at all)
- [x] A cart mixing two producers saves and reads back
- [x] `verify` passes
