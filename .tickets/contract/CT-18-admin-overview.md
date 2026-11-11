---
id: CT-18
title: API contract — admin overview summary
status: done
depends_on: [FE-18]
source: [FE-18, SCOPE.md §0, §2]
consumers: [apps/web/src/features/admin/admin-overview/admin-overview.http.ts]
---
Follows CT-00 (envelope, errors, auth, money, dates). Frozen once a human sets `status: done`.

## GET /api/admin/summary
Role: admin (Bearer token).

**200**
```ts
interface AdminSummary {
  users: number              // buyers and producers (all accounts except admins)
  orders: number             // all orders on the marketplace
  activeAuctions: number     // auctions with status active
  pendingProducers: number   // producer accounts waiting for approval
  byStatus: Partial<Record<OrderStatus, number>>  // OrderStatus from CT-07/CT-08: pending | confirmed | ready | delivered
  salesPerDay: { date: string; total: number }[]  // last 7 local days, YYYY-MM-DD, oldest first; total in EUR; days with no sales have total 0
}
```
An empty marketplace gets zeros and empty arrays, not 404.

**Errors**: 401 `UNAUTHORIZED`; 403 `FORBIDDEN` (not an admin).

## Realtime
None. The page loads once and offers a retry on error.
