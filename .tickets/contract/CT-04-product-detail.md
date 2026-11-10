---
id: CT-04
title: API contract — product detail with reviews
status: review
depends_on: [FE-04]
source: [FE-04, SCOPE.md §0]
consumers: [apps/web/src/features/catalog/product-detail/product-detail.http.ts, apps/web/src/features/catalog/product-detail/product-detail.dto.ts]
---
Follows CT-00; reuses `ProducerSummary` and the category values from CT-03. Frozen once a human sets `status: done`. Public endpoint (no token required; a token is ignored).

## Types
```ts
Review = {
  id: string,
  author: string,           // display name of the buyer
  rating: number,           // integer 1–5
  text: string,             // comment, may be ""
  date: string              // ISO 8601 UTC
}
ProductDetail = {
  id: string, name: string,
  price: number,            // euros, 2 decimals
  unit: string,             // "kg", "jar", "loaf", ...
  stock: number,            // integer >= 0; 0 = out of stock (still returned)
  category: "vegetables"|"fruit"|"honey"|"wine"|"cheese"|"bakery",
  imageUrl?: string,        // omitted when none
  producer: ProducerSummary,
  averageRating: number,    // 0–5, 0 when no reviews
  description: string,
  reviews: Review[]         // newest first, may be empty
}
```

## GET /api/products/:id
- 200 `ProductDetail` — also for `stock: 0` products, so the page can show "out of stock".
- 404 `PRODUCT_NOT_FOUND` — unknown id, producer not approved, or product hidden by moderation.

## Realtime
None.

## Done when
- [ ] Reviewed against SCOPE.md and the FE-04 DTOs/mocks, approved by a human (`status: done`)
