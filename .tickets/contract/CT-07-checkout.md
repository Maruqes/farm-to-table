---
id: CT-07
title: API contract — checkout (create orders)
status: done
depends_on: [FE-07]
source: [FE-07, SCOPE.md §0 order rules]
consumers: [apps/web/src/features/cart/checkout/checkout.http.ts, apps/web/src/features/cart/checkout/checkout.dto.ts]
---
Follows CT-00; reuses `Cart` from CT-06. Frozen once a human sets `status: done`. Needs a `buyer` token (401 `UNAUTHORIZED` without one, 403 `FORBIDDEN` for other roles). Payment happens on pickup/delivery; nothing about payment is sent.

## Types
```ts
Fulfilment = "pickup" | "delivery"
Address = { line1: string, city: string, postalCode: string } // all non-empty
OrderStatus = "pending" | "confirmed" | "ready" | "delivered"
OrderItem = {
  productId: string,
  name: string,
  price: number,     // euros, 2 decimals, price at order time
  quantity: number,  // integer >= 1
  unit: string
}
Order = {
  id: string,
  producer: { id: string, name: string, location: string },
  status: OrderStatus,  // always "pending" on creation
  items: OrderItem[],
  total: number         // euros, 2 decimals, sum of price * quantity
}
```

## POST /api/orders
Turns the buyer's whole server cart into one order per producer, decrements stock atomically, and empties the cart.
- Request `{ fulfilment: Fulfilment, address?: Address }` — `address` required when `fulfilment` is `"delivery"`, ignored for `"pickup"`.
- 201 `Order[]` — one per producer in the cart.
- 400 `VALIDATION_ERROR` — bad fulfilment, missing address fields (`fields` keys `line1`, `city`, `postalCode`; `address.line1` etc. also accepted by the client), or empty cart.
- 409 `STOCK_CHANGED` — some quantity exceeds current stock; no order is created and the cart is kept. The client sends the buyer back to `/cart`.

## Realtime
None on this page (`order-updated`, CT-00, is consumed by FE-08).
