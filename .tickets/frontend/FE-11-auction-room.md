---
id: FE-11
title: Auction room
status: todo
depends_on: [FE-01]
route: /auctions/:id
roles: [visitor, buyer]
scope: §0 auction rules, §3
owns:
  - apps/web/src/pages/AuctionRoomPage.tsx
  - apps/web/src/features/auctions/auction-room/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Current price and leader name, countdown from `endsAt`, watcher count, live bid history.
- Bid input with minimum (price + increment) and quick buttons +5 / +10 / +25 €; rejected-bid error shown only to that bidder.
- Visitors watch read-only; the owning producer cannot bid; states `scheduled`, `active`, `ended` (winner or "no winner").
- Hook `useAuction(id, token)` joins on mount, leaves on unmount, over the realtime stub. The client never decides the winner.

## Assumed API (draft)
- `GET /api/auctions/:id` → 200 {status, product, quantity, basePrice, increment, currentPrice, leader, endsAt, bids:[{amount, name, date}]}
- `POST /api/auctions/:id/bids` {amount} → 201; 409 on lost race
- socket on `auction:<id>`: `bid-placed`, `bid-rejected` (to bidder), `viewers`, `auction-ended`

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
