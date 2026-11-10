---
id: CT-23
title: API contract — admin all orders
status: done
depends_on: [FE-23]
source: [FE-23, SCOPE.md §2 admin]
consumers: [apps/web/src/features/admin/admin-orders/admin-orders.http.ts]
---
Follows CT-00 (envelope, errors, auth, dates). Frozen once a human sets `status: done`. Read-only: admins cannot change orders (state changes stay with the producer, CT-14).

## GET /api/admin/orders?status&page
Role: admin (Bearer token). Every order on the platform, newest first (`createdAt` desc), stable across pages.

Query:
- `status` (optional) — `pending` | `confirmed` | `ready` | `delivered` | `cancelled` (same values as CT-08/CT-14).
- `page` (optional, default 1) — 1-based. Fixed page size of **8**.

**200**
```ts
interface AdminOrder {
  id: string
  buyerName: string
  producerName: string
  itemCount: number      // number of line items
  total: number          // euros, 2 decimals
  status: 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled'
  createdAt: string      // ISO 8601
}
interface Response {
  items: AdminOrder[]    // empty array when no match, not 404; a page past the end is empty
  total: number          // matches across all pages
}
```
**Errors**: 400 `VALIDATION_ERROR` (unknown `status`, `page` not a positive integer); 401 `UNAUTHORIZED`; 403 `FORBIDDEN` (not an admin).

## Realtime
None.

## Done when
- [ ] Reviewed against SCOPE.md and approved by a human (`status: done`)
