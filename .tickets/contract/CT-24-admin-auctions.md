---
id: CT-24
title: API contract — admin all auctions
status: done
depends_on: [FE-24]
source: [FE-24, SCOPE.md §2 admin]
consumers: [apps/web/src/features/admin/admin-auctions/admin-auctions.http.ts]
---
Follows CT-00 (envelope, errors, auth, dates). Frozen once a human sets `status: done`. Read-only: admins only view auctions and open the room (`/auctions/:id`, CT-11); auction changes stay with the producer (CT-15).

## GET /api/admin/auctions?status&page
Role: admin (Bearer token). Every auction on the platform, newest first, stable across pages.

Query:
- `status` (optional) — `draft` | `scheduled` | `active` | `ended` (same values as CT-15).
- `page` (optional, default 1) — 1-based. Fixed page size of **8**.

**200**
```ts
interface AdminAuction {
  id: string
  status: 'draft' | 'scheduled' | 'active' | 'ended'
  product: { id: string; name: string; category?: string }
  producer: { id: string; name: string }
  currentPrice: number   // euros, 2 decimals; starting price until the first bid
  bidCount: number       // integer >= 0
  startsAt: string | null // ISO 8601
  endsAt: string | null   // ISO 8601
}
interface Response {
  items: AdminAuction[]  // empty array when no match, not 404; a page past the end is empty
  total: number          // matches across all pages
}
```
**Errors**: 400 `VALIDATION_ERROR` (unknown `status`, `page` not a positive integer); 401 `UNAUTHORIZED`; 403 `FORBIDDEN` (not an admin).

## Realtime
None (the list is fetched on load, filter and page change).

## Done when
- [ ] Reviewed against SCOPE.md and approved by a human (`status: done`)
