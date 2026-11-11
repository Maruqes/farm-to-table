---
id: BE-14
title: Auctions — model, public reads, producer manager
status: done
depends_on: [BE-06, BE-09]
contracts: [CT-03, CT-11, CT-15, CT-27]
scope: §0 rules of the auction, §3
owns:
  - apps/api/src/modules/auctions/auctions.model.ts
  - apps/api/src/modules/auctions/bids.model.ts
  - apps/api/src/modules/auctions/auctions.schemas.ts
  - apps/api/src/modules/auctions/auctions.service.ts
  - apps/api/src/modules/auctions/auctions.controller.ts
  - apps/api/src/modules/auctions/auctions.routes.ts
  - apps/api/src/modules/auctions/auctions.test.ts
  - apps/api/src/modules/products/products.service.ts
verify: cd apps/api && npm run typecheck && npm test
---
Blocked until CT-15 is `done` (README gap 1).

## Build
- `auctions.model.ts`: `producer`, `product` plus a copy of its `name`, `category`, `unit`; `quantity`, `basePrice`, `increment`, `durationMinutes`, `startsAt`, `endsAt`, `status` (`draft|scheduled|active|ended`), `cancelled`, `currentPrice`, `bidCount`, `leader` (`id`, `name`), `winner`, `lastViewers`. Index `{ status, endsAt }` and `{ status, startsAt }`.
- `bids.model.ts`: `auction` (indexed), `bidder`, `name`, `amount`, `createdAt`. Own collection (SCOPE.md §5).
- Public: `GET /api/auctions?status[&limit]` (CT-27, CT-03), `GET /api/auctions/:id` (CT-11, bids newest first capped at 50, `viewerCount` from `realtime/emit.ts`).
- Approved producer: `GET /api/auctions?producer=me`, `POST /api/auctions`, `PUT /api/auctions/:id`, `POST /api/auctions/:id/publish`, `POST /api/auctions/:id/cancel` (CT-15).
- Replace the BE-06 stub: `productHasLiveAuction(productId)`.

## Server rules
- Public reads never return `draft` or cancelled auctions; a draft's room is 404 `AUCTION_NOT_FOUND` even to its owner (the manager list is where drafts live).
- The product must match `{ _id: productId, producer: sub }`, else 403. `quantity <= stock` at save and again at publish.
- Every change is one conditional update on the expected state: edit and publish require `status: 'draft'` (else 409 `AUCTION_NOT_DRAFT`); cancel requires `bidCount: 0` and not ended (409 `AUCTION_HAS_BIDS` / `AUCTION_ALREADY_ENDED`). This is what stops a cancel racing a first bid.
- `endsAt` is always computed by the server from `startsAt + durationMinutes`. `currentPrice`, `bidCount`, `leader`, `status` in a body are ignored.
- Publish sets `scheduled`, or `active` when `startsAt` has passed by less than the duration; the timed start itself is BE-16.

## Done when
- [x] Draft → edit → publish → cancel works; each wrong-state call gives the contract's 409
- [x] A producer cannot edit, publish or cancel another producer's auction, nor auction another producer's product
- [x] Drafts and cancelled auctions are absent from every public response
- [x] `status` missing or unknown → 400; `limit` outside 1..20 → 400
- [x] `verify` passes
