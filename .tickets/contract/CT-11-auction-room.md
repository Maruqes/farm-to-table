---
id: CT-11
title: API contract — auction room
status: review
depends_on: [FE-11]
source: [FE-11, SCOPE.md §0 Rules of the auction, §3]
consumers: [apps/web/src/features/auctions/auction-room/auction-room.http.ts, apps/web/src/features/auctions/auction-room/auction-room.dto.ts, apps/web/src/features/auctions/auction-room/auction-room.realtime.ts]
---
Follows CT-00 (base path, error body, socket handshake and rooms). This contract adds four realtime events to the `auction:<id>` room, as CT-00 requires for module events.

## Types
```ts
type AuctionStatus = "scheduled" | "active" | "ended"
interface Person { id: string; name: string }

interface AuctionBid {
  id: string
  amount: number        // euros
  name: string          // bidder display name
  bidderId: string
  date: string          // ISO 8601
}

interface AuctionRoom {
  id: string
  status: AuctionStatus
  product: { id: string; name: string; category: string }
  producer: Person
  quantity: number
  unit: string          // e.g. "kg", "litres"
  basePrice: number
  increment: number     // minimum step
  currentPrice: number  // basePrice while there are no bids
  leader: Person | null
  startsAt: string
  endsAt: string
  bids: AuctionBid[]    // newest first; [] when none
  viewerCount: number
  winner: Person | null // only when status = "ended"; null = no winner
}
```

## GET /api/auctions/:id
Public (visitor, buyer, producer, admin).
- 200 → `AuctionRoom`
- 404 `AUCTION_NOT_FOUND`

## POST /api/auctions/:id/bids
Role `buyer`. Validated server-side with one atomic `findOneAndUpdate` (SCOPE §3): auction `active`, now < `endsAt`, `amount >= currentPrice + increment`.
- Request: `{ amount: number }`
- 201 → `AuctionBid`; the server then broadcasts `bid-placed`.
- 400 `VALIDATION_ERROR` (`fields.amount`) — missing or not a positive number
- 401 `UNAUTHORIZED` — no token
- 403 `OWN_LOT` — producer of the lot; `FORBIDDEN` — any non-buyer role
- 404 `AUCTION_NOT_FOUND`
- 409 `AUCTION_NOT_ACTIVE` — status is not `active`
- 409 `AUCTION_CLOSED` — past `endsAt`
- 409 `BID_TOO_LOW` — below `currentPrice + increment`
- 409 `BID_OUTBID` — lost the race to a concurrent bid; the bidder also gets `bid-rejected`

## Realtime (`auction:<id>`, client emits `join` / `leave` with `{ room }`)
- `bid-placed` → room: `{ auctionId: string, bid: AuctionBid, currentPrice: number, leader: Person, endsAt: string }`
- `viewers` → room, on every join/leave: `{ auctionId: string, count: number }`
- `auction-ended` → room: `{ auctionId: string, status: "ended", winner: Person | null, currentPrice: number }`
- `bid-rejected` → `user:<bidderId>` only: `{ auctionId: string, bidderId: string, amount: number, code: string, message: string }` (`code` is one of the 409 codes above)

The room page does not consume CT-00 `auction-updated`; `bid-placed` and `auction-ended` carry the same state.

## Done when
- [ ] API implements both endpoints with these codes and the atomic bid update
- [ ] Socket server emits the four events with these payloads
