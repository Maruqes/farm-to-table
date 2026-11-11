# Backend tickets

One small ticket per slice of `apps/api`, built from the frozen contracts in `.tickets/contract/`. The contract is the spec: a ticket never restates request/response shapes, it names the `CT-nn` files and adds only the server rules the contract cannot show. Shared conventions live here so tickets stay short.

Frontmatter: `id`, `title`, `status`, `depends_on`, `contracts`, `scope` (SCOPE.md sections), `owns`, `verify`. Status flow and parallel rules: `../README.md`.

## Order

```
BE-00 foundation ─ BE-01 auth ─ BE-02 seed
                      ├─ BE-03 profile
                      ├─ BE-04 producers ─┐
                      ├─ BE-05 catalog ───┼─ BE-06 producer products ─ BE-07 images
                      │                   └─ BE-08 cart ─┐
                      └─ BE-09 realtime ─ BE-10 notifications ─┼─ BE-11 checkout ─ BE-12 producer orders ─ BE-13 reviews
                                                               └─ BE-14 auctions ─ BE-15 bidding ─ BE-16 auction close
BE-17 producer stats · BE-18 admin producers+content · BE-19 admin reviews · BE-20 admin lists · BE-21 admin status
BE-22 OpenAPI/Swagger · BE-23 demo seed + mocks off
```

## Folder structure (every ticket follows it)

```
apps/api/src/
  app.ts                 mounts one router per module (each ticket adds exactly one line)
  server.ts              HTTP + Socket.io + startup (db connect, scheduler)
  config/env.ts          the only file reading process.env
  db/                    connect.ts, plugins (id/toJSON)
  middleware/            auth.ts (requireAuth, requireRole, requireApprovedProducer), validate.ts, errors.ts
  realtime/              socket.ts (handshake, rooms), emit.ts (emitToUser, emitToAuction)
  docs/                  openapi.ts
  lib/                   tiny shared helpers only (ApiError, money, escapeRegex)
  modules/<feature>/
    <feature>.model.ts        Mongoose schema (required / enum / min)
    <feature>.schemas.ts      zod schemas for body, query, params
    <feature>.service.ts      business rules and queries; no req/res
    <feature>.controller.ts   req → service → res; no Mongoose calls
    <feature>.routes.ts       router + middleware chain
    <feature>.test.ts         node:test, real HTTP against the app
```
Modules: `auth users producers products cart orders reviews notifications auctions admin`. `admin/` holds one file set per area (`admin-producers.*`, `admin-reviews.*`, ...) behind a single guarded `admin.routes.ts`. A module imports another module's **service**, never its model, except `users.model.ts` and `products.model.ts`, which are shared reads.

## Security floor (every endpoint)

- Every body, query and `:id` goes through a zod schema (`validate` middleware) before the controller. Unknown keys are stripped; ids must be valid ObjectIds (else the module's 404). This is also the NoSQL-injection guard: no raw `req.body` / `req.query` ever reaches a Mongoose filter.
- The acting user is always `req.user.sub` from the JWT. Never read a user, producer or owner id from the body or query.
- Ownership is checked in the query itself (`{ _id, producer: req.user.sub }`), not after loading.
- Role guards per route: `requireAuth` → 401 `UNAUTHORIZED`, `requireRole(...)` → 403 `FORBIDDEN`, `requireApprovedProducer` → 403 `PRODUCER_NOT_APPROVED` (status read from the database on each request, so a rejection applies at once).
- Responses are built by an explicit mapper to the contract type. Never return a Mongoose document: `passwordHash`, card data, `hidden` flags and other users' emails must not leak.
- User text used in `$regex` is escaped. Errors always use the CT-00 body; stack traces and Mongoose messages never reach the client.

## Data model decisions

- Collections: `users`, `products`, `orders`, `auctions`, `bids` (SCOPE.md §5) plus `reviews` and `notifications`.
- A producer is a `users` document with an embedded `producer` object (`farmName`, `status`, `bio`, `location`, `lat`, `lng`, `photoUrl`, `hidden`, `rejectReason`). Producer id = user id. Public `name` of a producer is `farmName`.
- The cart is embedded in the buyer's user document (`cart: [{ product, quantity }]`).
- `averageRating` and `ratingCount` are stored on products and producers and recomputed when a review is created, hidden or kept (BE-13, BE-19). Read endpoints just return the field.
- Money: numbers in euros rounded to 2 decimals on every write. Dates: `Date` in Mongo, ISO strings out.
- Mongo runs standalone (no replica set), so there are **no multi-document transactions**. Stock and bids use single-document conditional updates; multi-step writes roll back by hand.
- "Local day" in stats means `Europe/Lisbon`. Low-stock threshold is 5.

## Tests

`npm test` = `node --import tsx --test "src/**/*.test.ts"`, using the built-in runner, `app.listen(0)` and `fetch` (no supertest). It needs a reachable Mongo (`make dev`) and uses the database `farm_to_table_test`, dropped at the start of each file. Each ticket adds one test file covering: the happy path, one validation error, and every 401/403/ownership denial the contract lists.

## Finishing a ticket

Run `verify`, tick the boxes, set `status: review`, and report files changed, what was skipped and open questions. If the contract is wrong or incomplete, stop and open a contract ticket; do not bend the API silently.

## Open contract gaps (decide before the ticket that hits them)

1. **CT-13 and CT-15 are still `review`.** BE-06, BE-07 and BE-14 cannot start until a human sets them `done`.
2. **Phone numbers** appear in CT-08, CT-14 and CT-19 but no endpoint collects one. Tickets omit the field (it is optional everywhere).
3. **CT-19 `categories`**: not collected at registration. BE-18 returns the distinct categories of the producer's products (empty for a new producer).
4. **CT-22 `state: 'suspended'`** has no endpoint that sets it. BE-20 never returns it.
5. **Reviews are per order** (CT-08 sends only `orderId`), yet CT-04 shows reviews per product and CT-16 has `product: string | null`. Rule used by BE-13: the review belongs to the order's producer; `product` is the product name when the order has one line, else `null`; a product's reviews and average are those of orders containing it.
6. **Auction winner's order** (SCOPE.md §0 says "pickup or delivery") has no step where the winner chooses. BE-16 creates it as `pickup`.
7. **`cancelled` orders** (CT-14) also reach the buyer through `GET /api/orders/mine` and `order-updated`. Resolved 2026-11-11: the buyer page and CT-08 now include `cancelled` (see `.tickets/backend/INTEGRATION.md` mismatch 2).
8. **Product images**: the bucket is private, so BE-07 adds `GET /api/products/:id/image` (not in ENDPOINTS.md yet; the ticket adds it).
9. **More than one API replica** (elasticity bonus) needs the Socket.io Redis adapter and sticky sessions for rooms and viewer counts. Not ticketed here; the auction scheduler (BE-16) is already replica-safe.
