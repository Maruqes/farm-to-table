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

## Producers
- [x] GET /api/producers/:id — FE-05 — CT-05

## Cart
- [x] GET /api/cart — FE-06, FE-07 — CT-06
- [x] PUT /api/cart — FE-06, FE-07 — CT-06

## Orders
- [x] POST /api/orders — FE-07 — CT-07
- [x] GET /api/orders/mine — FE-08 — CT-08

## Reviews
- [x] POST /api/reviews — FE-08 — CT-08

## Notifications
- [x] GET /api/notifications — FE-09 — CT-09
- [x] PATCH /api/notifications/:id — FE-09 — CT-09

## Auctions
- [x] GET /api/auctions?status=active — FE-03 — CT-03
- [x] GET /api/auctions/:id — FE-11 — CT-11
- [x] POST /api/auctions/:id/bids — FE-11 — CT-11

## Realtime events (CT-00)
- [x] order-updated — FE-08 — CT-00, CT-08
- [ ] auction-updated — — CT-00
- [x] notification — FE-09 — CT-09
- [x] bid-placed — FE-11 — CT-11
- [x] bid-rejected — FE-11 — CT-11
- [x] viewers — FE-11 — CT-11
- [x] auction-ended — FE-11 — CT-11
