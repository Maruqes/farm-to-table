---
id: CT-15
title: API contract — producer auction manager
status: review
depends_on: [FE-15]
source: [FE-15, SCOPE.md §0, §3]
consumers: [apps/web/src/features/producer/producer-auctions/producer-auctions.http.ts]
---
Follows CT-00 (envelope, errors, auth, money, dates). Frozen once a human sets `status: done`.

Role for every endpoint: approved producer (Bearer token). The owner is always taken from the token. Product options come from `GET /api/products?producer=me` (CT-13).

```ts
type AuctionStatus = 'draft' | 'scheduled' | 'active' | 'ended'   // a cancelled auction is 'ended' with bidCount 0

interface ProducerAuction {
  id: string
  status: AuctionStatus
  product: { id: string; name: string; category: Category; unit: Unit }   // Category, Unit as CT-13
  quantity: number          // lot size, integer > 0
  unit: Unit
  basePrice: number         // EUR
  increment: number         // EUR, minimum bid step
  durationMinutes: number
  startsAt: string          // ISO 8601
  endsAt: string            // startsAt + durationMinutes
  currentPrice: number      // basePrice until the first bid
  bidCount: number
  leader: { id: string; name: string } | null
  createdAt: string
}

interface SaveAuctionRequest {
  productId: string         // own product
  quantity: number          // integer > 0, <= product stock
  basePrice: number         // > 0
  increment: number         // > 0
  durationMinutes: number   // 15, 30, 60 or custom 5..1440
  startsAt: string          // ISO, in the future
}
```

## GET /api/auctions?producer=me
**200** `ProducerAuction[]`, all own auctions in every status, newest first. Empty array when none.
**Errors**: 401 `UNAUTHORIZED`; 403 `FORBIDDEN`; 403 `PRODUCER_NOT_APPROVED`.

## POST /api/auctions
Body `SaveAuctionRequest`. Creates a `draft`. **201** `ProducerAuction`.
**Errors**: 400 `VALIDATION_ERROR` (field details); 401; 403 `FORBIDDEN` (product not owned); 403 `PRODUCER_NOT_APPROVED`.

## PUT /api/auctions/:id
Body `SaveAuctionRequest`. Draft only. **200** `ProducerAuction`.
**Errors**: 400 `VALIDATION_ERROR`; 401; 403 `FORBIDDEN`; 404 `NOT_FOUND`; 409 `AUCTION_NOT_DRAFT`.

## POST /api/auctions/:id/publish
No body. Draft → `scheduled` (or `active` if `startsAt` has passed). **200** `ProducerAuction`.
**Errors**: 400 `VALIDATION_ERROR` (start time in the past); 401; 403; 404; 409 `AUCTION_NOT_DRAFT`.

## POST /api/auctions/:id/cancel
No body. Allowed for `draft`, `scheduled` or `active` with no bids. **200** `ProducerAuction` with `status: 'ended'`, `leader: null`.
**Errors**: 401; 403; 404; 409 `AUCTION_HAS_BIDS`; 409 `AUCTION_ALREADY_ENDED`.

## Realtime
None consumed (the page refetches on load; live bids are in the room, CT-11).
