---
id: CT-03
title: API contract — public catalog and live auctions strip
status: review
depends_on: [FE-03]
source: [FE-03, SCOPE.md §0 §2]
consumers: [apps/web/src/features/catalog/home-catalog/catalog.http.ts, apps/web/src/features/catalog/home-catalog/catalog.dto.ts]
---
Follows CT-00. Frozen once a human sets `status: done`. Both endpoints are public (no token required; a token is ignored).

## Types
```ts
ProducerSummary = { id: string, name: string, location: string }
ProductListItem = {
  id: string, name: string,
  price: number,            // euros, 2 decimals
  unit: string,             // "kg", "jar", "bunch", ...
  stock: number,            // integer > 0 in this list
  category: "vegetables"|"fruit"|"honey"|"wine"|"cheese"|"bakery",
  imageUrl?: string,        // absolute or same-origin URL; omitted when none
  producer: ProducerSummary,
  averageRating: number     // 0–5, 0 when no reviews
}
AuctionSummary = {
  id: string,
  product: { id: string, name: string },
  currentPrice: number,     // euros
  endsAt: string            // ISO 8601 UTC
}
```

## GET /api/products
Query (all optional):
- `q` string — case-insensitive match on product name, ingredients or producer name
- `producer` string — producer id
- `category` one of the category values above
- `location` string — case-insensitive substring of the producer's location
- `season` `"spring"|"summer"|"autumn"|"winter"|"all-year"`
- `organic` `"true"|"false"`
- `sort` `"price-asc"|"price-desc"|"rating-desc"`; omitted = server's default order

Returns only buyable products: producer approved, product not hidden by moderation, `stock > 0`.
- 200 `ProductListItem[]` (plain array, may be empty)
- 400 `VALIDATION_ERROR` — unknown `category`, `season`, `sort` or non-boolean `organic` (`fields` names the parameter)

## GET /api/auctions?status=active&limit=3
Query: `status` (`"active"` used here), `limit` integer 1–20. Ordered by `endsAt` ascending.
- 200 `AuctionSummary[]` (empty when no auction is live; the strip is then hidden)
- 400 `VALIDATION_ERROR` — bad `status` or `limit`

## Realtime
None. The strip's countdown is computed client-side from `endsAt`.

## Done when
- [ ] Reviewed against SCOPE.md and the FE-03 DTOs/mocks, approved by a human (`status: done`)
