---
id: BE-15
title: Bidding — atomic bid and live room events
status: done
depends_on: [BE-14]
contracts: [CT-00, CT-11]
scope: §0 rules of the auction, §3 (core technical challenge)
owns:
  - apps/api/src/modules/auctions/bids.service.ts
  - apps/api/src/modules/auctions/bids.controller.ts
  - apps/api/src/modules/auctions/bids.schemas.ts
  - apps/api/src/modules/auctions/bids.test.ts
  - apps/api/src/modules/auctions/auctions.routes.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
`POST /api/auctions/:id/bids`, buyer only, with every code in CT-11.

## Server rules
- Read the auction once for the cheap answers: 404, 409 `AUCTION_NOT_ACTIVE`, 409 `AUCTION_CLOSED`, and 409 `BID_TOO_LOW` when `amount < currentPrice + increment` as just read. `403 OWN_LOT` applies to a producer token on its own lot; other non-buyers get `FORBIDDEN`.
- Then **one** atomic update, the only place the price changes:
  ```ts
  Auction.findOneAndUpdate(
    { _id, status: 'active', endsAt: { $gt: now },
      $expr: { $gte: [amount, { $add: ['$currentPrice', '$increment'] }] } },
    { $set: { currentPrice: amount, leader }, $inc: { bidCount: 1 } },
    { new: true })
  ```
  `now` is the server clock. If it returns null after the pre-read passed, the bidder lost a race → 409 `BID_OUTBID` and `bid-rejected` to `user:<bidderId>` only.
- Only after the update succeeds: insert the `Bid`, answer 201, then emit `bid-placed` to the room and `auction-updated` (CT-00) with the same state.
- `amount` is a finite number with at most 2 decimals, rounded, capped at 1 000 000. Bidder id and name come from the token's user, never the body.
- Rate limit: 5 bids per second per user → 429.

## Done when
- [x] 20 parallel bids of the same amount from different buyers: exactly one 201, the rest 409, `bidCount` is 1 and one `Bid` document exists (tested)
- [x] A bid one millisecond after `endsAt` is refused even if the status is still `active`
- [x] The room receives `bid-placed`; only the loser receives `bid-rejected`
- [x] Visitor → 401; producer and admin → 403; owner of the lot → 403 `OWN_LOT`
- [x] `verify` passes
