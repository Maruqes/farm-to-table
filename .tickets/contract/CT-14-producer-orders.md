---
id: CT-14
title: API contract — producer orders
status: review
depends_on: [FE-14]
source: [FE-14, SCOPE.md §0 order states, §4]
consumers: [apps/web/src/features/producer/producer-orders/producer-orders.http.ts, apps/web/src/features/producer/producer-orders/producer-orders.dto.ts, apps/web/src/features/producer/producer-orders/producer-orders.realtime.ts]
---
Follows CT-00; reuses `Fulfilment`, `Address` and `OrderItem` from CT-07. Both endpoints need a `producer` token (401 `UNAUTHORIZED`, 403 `FORBIDDEN` for other roles).

## Types
```ts
// Extends CT-07 OrderStatus with "cancelled" (reachable only from "pending").
OrderStatus = "pending" | "confirmed" | "ready" | "delivered" | "cancelled"
ProducerOrder = {
  id: string,
  status: OrderStatus,
  createdAt: string,          // ISO 8601
  updatedAt: string,          // ISO 8601
  buyer: { id: string, name: string, email?: string, phone?: string },
  items: OrderItem[],         // only this producer's items
  total: number,              // euros, 2 decimals
  fulfilment: Fulfilment,
  address?: Address | null    // present when fulfilment is "delivery"
}
```

## GET /api/orders?producer=me
- 200 `ProducerOrder[]` — orders containing the producer's products, newest first; `[]` when none.

## PATCH /api/orders/:id/status
- Request `{ status: OrderStatus }` — only the next step (`pending→confirmed→ready→delivered`) or `cancelled` while `pending`.
- 200 `ProducerOrder` — the updated order.
- 400 `INVALID_STATUS_TRANSITION` — not the next step, or cancelling after `pending`.
- 403 `FORBIDDEN` — order has none of this producer's products.
- 404 `ORDER_NOT_FOUND`.

## Realtime (on `user:<producerId>`)
- Consumes `order-updated` as defined in CT-00 (`{ orderId, status, updatedAt }`); also emitted to the producer when the status changes from any tab or by the server.
- New event `order-created` — payload `ProducerOrder` (the client also accepts `{ order: ProducerOrder }`), emitted when a buyer places an order containing the producer's products.
