---
id: BE-05
title: Catalog — product model, public list and detail
status: done
depends_on: [BE-01, BE-04]
contracts: [CT-03, CT-04, CT-05, CT-26]
scope: §0 catalog rules, §5, §6
owns:
  - apps/api/src/modules/products/products.model.ts
  - apps/api/src/modules/products/products.schemas.ts
  - apps/api/src/modules/products/products.service.ts
  - apps/api/src/modules/products/products.controller.ts
  - apps/api/src/modules/products/products.routes.ts
  - apps/api/src/modules/products/products.test.ts
  - apps/api/src/modules/producers/producers.service.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
- `products.model.ts`: `producer` (ref User, indexed), `name`, `description`, `ingredients`, `category`, `price`, `unit`, `stock`, `season`, `organic`, `imageKey`, `hidden`, `averageRating`, `ratingCount`, timestamps. `required` / `enum` / `min` on every field that has them in CT-13.
- `GET /api/products` with every CT-03 filter and sort; `GET /api/products/:id` as CT-04 (`reviews: []` until BE-13).
- Fill the producers service hook from BE-04 so `GET /api/producers/:id` returns visible products and the directory returns `productCount`.

## Server rules
- "Buyable" in one shared service function: producer approved, product not hidden, and for the list `stock > 0`. Detail also returns `stock: 0`. Everything else is 404 `PRODUCT_NOT_FOUND`.
- `q` matches product name, ingredients or producer name with an escaped, case-insensitive `$regex` (this is the SCOPE.md §5 operator query). Cap `q` at 100 chars.
- A token on these endpoints is ignored; `producer=me` is reserved for BE-06 and answers 400 here until then.
- Cap the list at 200 items; no pagination in the contract.

## Done when
- [x] Hidden products, zero-stock products and products of non-approved or hidden producers never appear in the list (tested, one case each)
- [x] Every filter and all three sorts work; unknown `category`, `season`, `sort` or `organic` → 400 naming the parameter
- [x] A regex metacharacter in `q` (e.g. `.*`) is treated as literal text
- [x] `verify` passes
