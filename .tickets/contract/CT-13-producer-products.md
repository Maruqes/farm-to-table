---
id: CT-13
title: API contract — producer product manager
status: review
depends_on: [FE-13]
source: [FE-13, SCOPE.md §0, §6]
consumers: [apps/web/src/features/producer/producer-products/producer-products.http.ts]
---
Follows CT-00 (envelope, errors, auth, money, dates). Frozen once a human sets `status: done`.

Role for every endpoint: approved producer (Bearer token). The owner is always taken from the token; a producer can only change or delete their own products.

```ts
type Category = 'vegetables' | 'fruit' | 'honey' | 'wine' | 'cheese' | 'bakery'   // same as CT-03
type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all-year'               // same as CT-03
type Unit = 'kg' | 'bunch' | 'jar' | 'bottle' | 'wheel' | 'loaf'

interface ProducerProduct {
  id: string
  name: string
  category: Category
  price: number        // EUR
  unit: Unit
  stock: number        // integer >= 0
  season: Season
  organic: boolean
  imageUrl?: string    // absent until an image is uploaded
}

interface SaveProductRequest {
  name: string         // trimmed, 2..80 chars
  category: Category
  price: number        // > 0, <= 100000
  unit: Unit
  stock: number        // integer, 0..1000000
  season: Season
  organic: boolean
}
```

## GET /api/products?producer=me
**200** `ProducerProduct[]` — all own products, including out-of-stock ones. Empty array when there are none.
**Errors**: 401 `UNAUTHORIZED`; 403 `FORBIDDEN` (not a producer); 403 `PRODUCER_NOT_APPROVED`.

## POST /api/products
Body `SaveProductRequest`. **201** `ProducerProduct`.
**Errors**: 400 `VALIDATION_ERROR` (with field details per CT-00); 401; 403 `FORBIDDEN`; 403 `PRODUCER_NOT_APPROVED`.

## PUT /api/products/:id
Body `SaveProductRequest` (full replace of these fields; `imageUrl` is kept). **200** `ProducerProduct`.
**Errors**: 400 `VALIDATION_ERROR`; 401; 403 `FORBIDDEN` (not the owner); 404 `NOT_FOUND`.

## DELETE /api/products/:id
**204**, no body.
**Errors**: 401; 403 `FORBIDDEN` (not the owner); 404 `NOT_FOUND`; 409 `PRODUCT_IN_AUCTION` if the product has an active auction.

## POST /api/products/:id/image
`multipart/form-data`, one file in field `image`; JPG, PNG or WebP, max 5 MB. Called after create/update when the producer picked a photo. Replaces the previous image.
**200** `{ imageUrl: string }`.
**Errors**: 400 `VALIDATION_ERROR` (missing file, wrong type, over 5 MB; `fields.image`); 401; 403 `FORBIDDEN`; 404 `NOT_FOUND`.

## Realtime
None.
