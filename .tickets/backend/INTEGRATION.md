# BE-23 — backend vs web/contract integration check

Walked with `VITE_USE_MOCKS=off` equivalent: real API on :3000, real Mongo,
real Socket.io (two clients for the live-bid check). One line per route in
`.tickets/frontend/ROUTES.md`. `ok` = the page's endpoint(s) returned the fields
the web adapter/DTO expects. Web/contract bugs are NOT patched here.

## Flows (SCOPE.md §0)

- [x] buy something: visitor finds Heirloom tomatoes → buyer cart PUT → checkout
  pickup → producer pending→confirmed→ready→delivered, live `order-updated`
  received on buyer socket → buyer sees delivered → POST review 201
- [x] become a producer: register returns `producerStatus: pending` → admin queue
  shows the applicant → approve → re-login `approved` → POST product →
  visible in public catalog search
- [x] run an auction: draft → publish → `active` → bid via API, `bid-placed`
  received with identical payload on BOTH socket clients → outbid → seeded
  active auction closed by the scheduler into `ended` with winner Maria Silva
  and a pickup order for the producer; winner got an `auction-won` notification

## Routes

- `/` — ok (GET /api/products 31 items; GET /api/auctions?status=active listed the live lot)
- `/products/:id` — ok (detail has id,name,price,unit,stock,category,producer{id,name,location},averageRating,description,reviews[{id,author,rating,text,date}]; reviewed product shows 4 reviews)
- `/producers` — ok (items {id,name,location,averageRating,productCount}; FIXED below: name is the farm name)
- `/producers/:id` — ok ({id,name,bio,location,lat,lng,averageRating,products[5]}; coords present; FIXED name)
- `/auctions` — ok (GET ?status=active|scheduled|ended; ended shows winner)
- `/auctions/:id` — ok (full room shape incl. bids[{id,amount,name,bidderId,date}], viewerCount, winner; `bid-placed`/`viewers`/`auction-ended` live)
- `/login` — ok (POST /api/auth/login → {user{id,name,email,role,producerStatus},token})
- `/register` — ok (buyer + producer 201; producer gets producerStatus pending)
- `/account` — ok (session only, no endpoint)
- `/cart` — ok (GET/PUT /api/cart {items[{productId,name,price,quantity,unit,stock,category,producer{id,name,location}}]})
- `/checkout` — ok (cart + POST /api/orders {fulfilment} → 201 one order per producer)
- `/orders` — ok (cancelled handled after the 2026-11-11 web fix; see mismatch 2)
- `/profile` — ok (GET/PUT /api/users/me {id,name,email,address,card}; PUT /api/users/me/card; no role field and the web expects none)
- `/producer` — ok (GET /api/producers/me/stats {sales,toHandle,activeProducts,averageRating,salesPerDay,byStatus,lowStock,activeAuction})
- `/producer/products` — ok (GET/POST/PUT/DELETE ?producer=me; create→update→delete verified)
- `/producer/page` — ok (GET/PUT /api/producers/me {id,name,bio,location,lat,lng,photoUrl}; FIXED name)
- `/producer/orders` — ok (GET ?producer=me + PATCH pending→confirmed→ready→delivered; live `order-updated` to buyer AND producer rooms)
- `/producer/reviews` — ok (GET ?producer=me [{id,author,rating,text,product,reported}] + POST /:id/report)
- `/producer/auctions` — ok (GET ?producer=me + POST draft + PUT + publish + cancel)
- `/producer/status` — ok (session only: postAuthPath reads producerStatus; pending producers get 403 PRODUCER_NOT_APPROVED on /producers/me* by design and the page never calls it)
- `/admin` — ok (GET /api/admin/summary)
- `/admin/producers` — ok (GET ?status=pending + approve + reject)
- `/admin/reviews` — ok (GET ?reported=true + keep + hide on open report; hidden review leaves the producer list; seeded report untouched)
- `/admin/moderation` — ok (GET /api/admin/content?type=product|producer + PATCH hide→product 404s publicly→unhide round-trip)
- `/admin/users` — ok (GET /api/admin/users paged shape)
- `/admin/orders` — ok (GET /api/admin/orders incl. auction winner order)
- `/admin/auctions` — ok (GET /api/admin/auctions)
- `/admin/status` — ok (5 services: api, socket, mongo, silo, swagger all operational)
- `*` (404) — ok (client route, no endpoint)

## Mismatches

1. FIXED in BE-23 (API broke the backend README rule "public name of a
   producer is farmName", which the admin lists and all web fixtures already
   follow): `GET /api/producers`, `GET /api/producers/:id`,
   `GET /api/producers/me`, catalog/detail `producer.name`, cart lines,
   `GET /api/orders/mine` producer, auction-room producer and catalog `q`
   search all returned the personal account name. Now all return
   `producer.farmName ?? name`; directory `q`/sort run on the farm name.
   Files: `apps/api/src/lib/producer-name.ts` (new),
   `modules/{producers,products,cart,orders,auctions}/*.service.ts`,
   plus one regression test per module (personal name differs from farm name).
2. FIXED 2026-11-11 (web + contract follow-up): README gap 7. API
   `GET /api/orders/mine` returns `status: "cancelled"` with history
   `pending→cancelled` (verified), but the buyer page dropped it. The web now
   accepts `cancelled` in `my-orders.types.ts` / adapter / labels, treats it as
   final in the live `order-updated` reducer, and renders a cancelled badge and
   timeline note; CT-08 records the amendment. The cancel event is also
   covered by the browser check listed above.
3. FIXED 2026-11-11: `apps/web/src/services/realtime.ts` still had an empty
   `SocketRealtimeClient`, so with mocks off no page received live events. It
   now wraps `socket.io-client` (JWT from the handshake, `join`/`leave`,
   rejoin after reconnect) and was verified in the browser: the auction room
   showed the server viewer count and a bid placed by another client, and the
   buyer order page moved `pending → confirmed` without a reload.
4. FIXED 2026-11-11: the public producer rating was the mean of the product
   averages, while the dashboard used the stored review aggregate. A producer
   with one heavily reviewed product showed a different rating in the
   directory/page than in the dashboard. `GET /api/producers` and
   `GET /api/producers/:id` now return `producer.averageRating` (written by
   `recomputeRatings`), with a regression test.
5. FIXED 2026-11-11: a bid that lost the atomic race to the auction closing
   was reported as `BID_OUTBID` ("another bid arrived first"). `placeBid` now
   re-reads the state and returns `AUCTION_NOT_ACTIVE` / `AUCTION_CLOSED` when
   the scheduler closed the lot.
6. FIXED 2026-11-11: settlement recovery could create a second order after a
   crash between order creation and the winner write. `settleAuction` now
   adopts the existing order for the auction instead of charging and
   decrementing stock again.
7. FIXED 2026-11-11: `POST /api/admin/reviews/:id/keep` on an already hidden
   review returned 200 but left it in the queue; it now returns
   `REVIEW_NOT_FOUND`, matching "the review stays public and leaves the queue".
8. FIXED 2026-11-11: behind the compose proxy, rate limiters keyed every
   request to the nginx IP (one shared 10/min bucket). The API trusts one
   proxy hop when `TRUST_PROXY=1` (compose sets it), and nginx forwards
   `X-Forwarded-For`.
9. FIXED 2026-11-11: the repo `.env` mock switch was never read by Vite (it
   looked in `apps/web`). `vite.config.ts` now uses the repo root as `envDir`,
   `.env.example` defaults to mocks off, and the dev-only role switcher is
   hidden when mocks are off.
10. FIXED 2026-11-11: a bid of exactly the minimum could be refused as
    `BID_OUTBID` when `currentPrice + increment` is not exact in floating point
    (1.1 + 2.2). The atomic update now rounds the sum to cents like the
    pre-check does; regression case in `bids.test.ts`.
11. FIXED 2026-11-11: cancelling a scheduled/active auction emitted nothing, so
    an open room kept counting down. `cancelAuction` now emits `auction-ended`
    with no winner.
12. FIXED 2026-11-11 (web): an expired or invalid token (JWT lasts 2h) left the
    user "signed in" with every page failing. A 401 `UNAUTHORIZED` from the API
    or the socket handshake now ends the session with a toast.
13. FIXED 2026-11-11 (web): `RequireApprovedProducer` existed but was not on any
    route, so pending/rejected producers could open the producer pages and get
    403s. The six producer routes are guarded, and a `producer-approved` /
    `producer-rejected` notification updates the session without a new login.
14. FIXED 2026-11-11 (test): the admin status test expected Swagger UI `down`
    (pre BE-22) and failed whenever a dev API was listening on :3000.
