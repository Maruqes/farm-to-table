---
id: CT-12
title: API contract — producer dashboard stats
status: review
depends_on: [FE-12]
source: [FE-12, SCOPE.md §0, §2]
consumers: [apps/web/src/features/producer/producer-dashboard/producer-dashboard.http.ts, apps/web/src/features/producer/producer-dashboard/producer-dashboard.realtime.ts]
---
Follows CT-00 (envelope, errors, auth, money, dates). Frozen once a human sets `status: done`.

## GET /api/producers/me/stats
Role: approved producer (Bearer token). The producer is taken from the token, never from the URL.

**200**
```ts
interface ProducerStats {
  sales: number              // EUR, total revenue of the last 7 days (same window as salesPerDay)
  toHandle: number           // own orders in pending or confirmed
  activeProducts: number     // own products listed in the catalog
  averageRating: number      // 0..5, 0 when there are no reviews
  salesPerDay: { day: string; total: number }[]   // last 7 local days, YYYY-MM-DD, oldest first; days with no sales have total 0
  byStatus: Partial<Record<OrderStatus, number>>  // OrderStatus from CT-07/CT-08: pending | confirmed | ready | delivered
  lowStock: { productId: string; name: string; stock: number }[]  // own active products at or below the low-stock threshold, lowest first
  activeAuction?: {          // absent or null when no own auction is running
    id: string
    product: { id: string; name: string }
    currentPrice: number     // EUR
    bidCount: number
    viewers: number
  } | null
}
```
A producer with no data gets zeros and empty arrays, not 404.

**Errors**: 401 `UNAUTHORIZED`; 403 `FORBIDDEN` (not a producer); 403 `PRODUCER_NOT_APPROVED`.

## Realtime
No new event. The page listens on `user:<id>` for the `notification` event (CT-09) and refetches the stats when its `type` is `order-new` or `order-status-changed`. The server must emit `order-new` to the producer when a buyer places an order for them.
