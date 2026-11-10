# API endpoints and realtime events — master checklist

`[x]` = a finished frontend page uses it and its contract is written. Never delete a line.

Format: `- [ ] METHOD path — FE tickets — contract`

## Auth
- [x] POST /api/auth/login — FE-01 — CT-01
- [x] POST /api/auth/register — FE-01 — CT-01

## Users
- [x] GET /api/users/me — FE-10 — CT-10
- [x] PUT /api/users/me — FE-10 — CT-10
- [x] PUT /api/users/me/card — FE-10 — CT-10

## Products
- [x] GET /api/products — FE-03 — CT-03
- [x] GET /api/products/:id — FE-04 — CT-04
- [x] GET /api/products?producer=me — FE-13, FE-15 — CT-13
- [x] POST /api/products — FE-13 — CT-13
- [x] PUT /api/products/:id — FE-13 — CT-13
- [x] DELETE /api/products/:id — FE-13 — CT-13
- [x] POST /api/products/:id/image — FE-13 — CT-13

## Producers
- [x] GET /api/producers/:id — FE-05 — CT-05
- [x] GET /api/producers/me — FE-17 — CT-17
- [x] PUT /api/producers/me — FE-17 — CT-17
- [x] GET /api/producers/me/stats — FE-12 — CT-12

## Cart
- [x] GET /api/cart — FE-06, FE-07 — CT-06
- [x] PUT /api/cart — FE-06, FE-07 — CT-06

## Orders
- [x] POST /api/orders — FE-07 — CT-07
- [x] GET /api/orders/mine — FE-08 — CT-08
- [x] GET /api/orders?producer=me — FE-14 — CT-14
- [x] PATCH /api/orders/:id/status — FE-14 — CT-14

## Reviews
- [x] POST /api/reviews — FE-08 — CT-08
- [x] GET /api/reviews?producer=me — FE-16 — CT-16
- [x] POST /api/reviews/:id/report — FE-16 — CT-16
- [x] GET /api/admin/reviews?reported=true — FE-20 — CT-20
- [x] POST /api/admin/reviews/:id/keep — FE-20 — CT-20
- [x] POST /api/admin/reviews/:id/hide — FE-20 — CT-20

## Notifications
- [x] GET /api/notifications — FE-09 — CT-09
- [x] PATCH /api/notifications/:id — FE-09 — CT-09

## Auctions
- [x] GET /api/auctions?status=active — FE-03 — CT-03
- [x] GET /api/auctions/:id — FE-11 — CT-11
- [x] POST /api/auctions/:id/bids — FE-11 — CT-11
- [x] GET /api/auctions?producer=me — FE-15 — CT-15
- [x] POST /api/auctions — FE-15 — CT-15
- [x] PUT /api/auctions/:id — FE-15 — CT-15
- [x] POST /api/auctions/:id/publish — FE-15 — CT-15
- [x] POST /api/auctions/:id/cancel — FE-15 — CT-15

## Admin
- [x] GET /api/admin/summary — FE-18 — CT-18
- [x] GET /api/admin/producers?status=pending — FE-19 — CT-19
- [x] POST /api/admin/producers/:id/approve — FE-19 — CT-19
- [x] POST /api/admin/producers/:id/reject — FE-19 — CT-19
- [x] GET /api/admin/content?type=product|producer — FE-21 — CT-21
- [x] PATCH /api/admin/content/:type/:id — FE-21 — CT-21
- [x] GET /api/admin/users?q&role&page — FE-22 — CT-22
- [x] GET /api/admin/orders?status&page — FE-23 — CT-23

## Realtime events (CT-00)
- [x] order-updated — FE-08, FE-14 — CT-00, CT-08, CT-14
- [x] order-created — FE-14 — CT-14
- [ ] auction-updated — — CT-00
- [x] notification — FE-09, FE-12 — CT-09, CT-12
- [x] bid-placed — FE-11 — CT-11
- [x] bid-rejected — FE-11 — CT-11
- [x] viewers — FE-11 — CT-11
- [x] auction-ended — FE-11 — CT-11
