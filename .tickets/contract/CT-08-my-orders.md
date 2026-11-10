---
id: CT-08
title: API contract — my orders and ratings
status: review
depends_on: [FE-08]
source: [FE-08, SCOPE.md §0 order states + ratings]
consumers: [apps/web/src/features/orders/my-orders/my-orders.http.ts, apps/web/src/features/orders/my-orders/my-orders.dto.ts]
---
Follows CT-00; reuses `OrderStatus` and `OrderItem` from CT-07. Both endpoints need a `buyer` token (401 `UNAUTHORIZED`, 403 `FORBIDDEN` for other roles).

## Types
```ts
OrderHistoryEntry = { status: OrderStatus, date: string } // ISO 8601, oldest first
MyOrder = {
  id: string,
  status: OrderStatus,
  history: OrderHistoryEntry[],
  producer: {
    id: string, name: string, location: string,
    email?: string, phone?: string,   // contact buttons hidden when missing
    lat?: number, lng?: number        // map button hidden when missing
  },
  items: OrderItem[],
  total: number,                       // euros, 2 decimals
  reviewed: boolean,
  review?: { rating: number, text: string } | null  // present when reviewed; shown read-only
}
```

## GET /api/orders/mine
- 200 `MyOrder[]` — the buyer's orders, newest first; `[]` when none.

## POST /api/reviews
- Request `{ orderId: string, rating: number /* integer 1–5 */, text?: string /* trimmed, max 500 */ }`
- 201 `{ id: string, orderId: string, rating: number, text: string, createdAt: string }` (the client ignores the body and marks the order reviewed).
- 400 `VALIDATION_ERROR` — rating out of range or text too long (`fields.rating`, `fields.text`).
- 404 `ORDER_NOT_FOUND` — not one of the buyer's orders.
- 409 `ORDER_NOT_DELIVERED` — order status is not `delivered`.
- 409 `ALREADY_REVIEWED` — this order was already rated; the client shows it read-only.

## Realtime
- Consumes `order-updated` on `user:<buyerId>` exactly as defined in CT-00 (`{ orderId, status, updatedAt }`). The client ignores events that move an order backwards and otherwise takes the server status.
