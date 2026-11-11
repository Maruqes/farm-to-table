---
id: BE-16
title: Auction lifecycle — timed start, close, payment cascade, winner order
status: done
depends_on: [BE-15, BE-11, BE-03]
contracts: [CT-09, CT-11]
scope: §0 winning and payment (mock), §3
owns:
  - apps/api/src/modules/auctions/auction-lifecycle.ts
  - apps/api/src/modules/auctions/auction-lifecycle.test.ts
  - apps/api/src/server.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
- `auction-lifecycle.ts`: `tick(now)` plus `startScheduler()` (a 1 s `setInterval` calling `tick`, started from `server.ts`, not from `app.ts`, so tests call `tick` directly with a fake `now`).
- Start: `updateMany({ status: 'scheduled', startsAt: { $lte: now } }, { status: 'active' })`.
- Close, one auction at a time: **claim** it with `findOneAndUpdate({ status: 'active', endsAt: { $lte: now } }, { $set: { status: 'ended', lastViewers } })`. Only the process that gets the document back settles it, so two API replicas or two overlapping ticks never settle the same auction twice.

## Settling a claimed auction
1. Take the highest bid per distinct bidder, highest first.
2. For each, `chargeCard(bidderId)` (BE-03). Failure → `notify(bidder, 'auction-skipped', <why>)`, try the next.
3. First success is the winner: decrement the product stock by the lot quantity with the conditional `$inc` from BE-11 (if stock is now too low, treat as no winner), `createOrder` at the winning amount as `pickup` (README gap 6), set `winner`, `notify(winner, 'auction-won', ...)`, `notify(producer, 'order-new', ...)` and emit `order-created` to the producer.
4. Nobody pays, or no bids: `winner: null`, stock untouched.
5. Emit `auction-ended` to the room (CT-11).

## Server rules
- No extra time: a bid after `endsAt` is already refused by BE-15, so closing a second late changes no outcome.
- A crash between claim and settle leaves an `ended` auction with no `settledAt`; `tick` also picks up `ended`, not cancelled, unsettled auctions older than 10 s and settles them. Set `settledAt` last.

## Done when
- [x] Top bidder with `simulateInvalid`, second valid: second wins, first gets `auction-skipped`, one order exists at the second bidder's amount
- [x] All cards fail, or no bids: no order, stock unchanged, `auction-ended` with `winner: null`
- [x] Running `tick` twice in parallel on a due auction creates one order (tested)
- [x] A scheduled auction becomes `active` at `startsAt`
- [x] `verify` passes
