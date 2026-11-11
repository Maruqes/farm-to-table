---
id: CT-05
title: API contract — public producer page
status: done
depends_on: [FE-05]
source: [FE-05, SCOPE.md §0, §1 maps]
consumers: [apps/web/src/features/producer/producer-public/producer-public.http.ts, apps/web/src/features/producer/producer-public/producer-public.dto.ts]
---
Follows CT-00; reuses the category values from CT-03. Frozen once a human sets `status: done`. Public endpoint (no token required; a token is ignored).

## Types
```ts
ProducerProduct = {
  id: string, name: string,
  price: number,            // euros, 2 decimals
  unit: string,             // "kg", "jar", "loaf", ...
  stock: number,            // integer >= 0
  category: "vegetables"|"fruit"|"honey"|"wine"|"cheese"|"bakery",
  imageUrl?: string,        // omitted when none
  averageRating: number     // 0–5, 0 when no reviews
}
ProducerPublic = {
  id: string, name: string,
  bio: string,              // may be ""
  location: string,         // human-readable place, e.g. "Douro, Portugal"
  lat?: number,             // -90..90; omitted when unknown (map hidden)
  lng?: number,             // -180..180; omitted when unknown
  averageRating: number,    // 0–5, 0 when no reviews
  products: ProducerProduct[] // visible products only, may be empty
}
```
Products carry no `producer` object; the page fills it from the parent.

## GET /api/producers/:id
- 200 `ProducerPublic`
- 404 `PRODUCER_NOT_FOUND` — unknown id, producer not approved, or page hidden by an admin.

## Realtime
None.
