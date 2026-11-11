---
id: CT-27
title: API contract — public auctions list
status: done
depends_on: [FE-27]
source: [FE-27, SCOPE.md §0]
consumers: [apps/web/src/features/auctions/auctions-list/auctions-list.http.ts, apps/web/src/features/auctions/auctions-list/auctions-list.dto.ts]
---
Follows CT-00. Public endpoint (no token required; a token is ignored). Extends the `GET /api/auctions?status` endpoint of CT-03 to all three public states; CT-03's `limit` stays optional.

## Types
```ts
AuctionListItem = {
  id: string,
  product: { id: string, name: string, category: string },  // category drives the card tile/icon
  currentPrice: number,   // EUR; starting price while scheduled, final price when ended
  endsAt: string,         // ISO 8601
  viewers: number,        // current room watchers, integer >= 0 (last known count when ended)
  status: "active" | "scheduled" | "ended"
}
```

## GET /api/auctions?status
- Query: `status` required, one of `active`, `scheduled`, `ended`. Not paginated.
- Order: `active`/`scheduled` by `endsAt` ascending; `ended` by `endsAt` descending.
- Draft/cancelled auctions are never returned.
- 200 `AuctionListItem[]` (may be empty)
- 400 `VALIDATION_ERROR` — missing or unknown `status`

## Realtime
None. Countdowns are computed client-side from `endsAt`. The nav "Auctions" badge uses the length of `GET /api/auctions?status=active`.

## Done when
- [ ] Reviewed against SCOPE.md and the FE-27 DTOs/mocks, approved by a human (`status: done`)
