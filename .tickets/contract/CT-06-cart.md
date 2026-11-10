---
id: CT-06
title: API contract — cart
status: review
depends_on: [FE-06]
source: [FE-06, SCOPE.md §0 cart]
consumers: [apps/web/src/features/cart/cart/cart.http.ts, apps/web/src/features/cart/cart/cart.dto.ts]
---
Follows CT-00; reuses the category values from CT-03. Frozen once a human sets `status: done`. Both endpoints need a `buyer` token (401 `UNAUTHORIZED` without one, 403 `FORBIDDEN` for other roles). One cart per buyer; it may mix producers.

## Types
```ts
CartItem = {
  productId: string,
  name: string,
  price: number,            // euros, 2 decimals, current product price
  quantity: number,         // integer >= 1, <= stock
  unit: string,             // "kg", "jar", ...
  stock: number,            // integer >= 0, current stock
  category: "vegetables"|"fruit"|"honey"|"wine"|"cheese"|"bakery",
  imageUrl?: string,        // omitted when none
  producer: { id: string, name: string, location: string }
}
Cart = { items: CartItem[] } // empty array when the cart is empty
```

## GET /api/cart
- 200 `Cart` — the signed-in buyer's cart.

## PUT /api/cart
Replaces the whole cart.
- Request `{ items: { productId: string, quantity: number }[] }` — quantity integer >= 1; `[]` empties the cart.
- 200 `Cart` — the saved cart, with current prices and stock.
- 400 `VALIDATION_ERROR` — bad body or quantity.
- 404 `PRODUCT_NOT_FOUND` — a product no longer exists or is hidden.
- 409 `STOCK_CHANGED` — a quantity exceeds current stock; nothing is saved. The client reloads with GET.

## Realtime
None.
