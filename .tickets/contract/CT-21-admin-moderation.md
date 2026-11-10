---
id: CT-21
title: API contract — admin content moderation
status: review
depends_on: [FE-21]
source: [FE-21, SCOPE.md §2 moderate content]
consumers: [apps/web/src/features/admin/admin-moderation/admin-moderation.http.ts]
---
Follows CT-00 (envelope, errors, auth, dates). Frozen once a human sets `status: done`.

`type` is `product` or `producer`. Hidden content is removed from the public catalog and producer pages; it is never deleted or edited here.

## GET /api/admin/content?type=product|producer
Role: admin (Bearer token). All products, or all producer pages, including hidden ones.

**200**
```ts
interface AdminContentItem {
  id: string
  name: string       // product name, or producer page name
  hidden: boolean
}
type Response = AdminContentItem[]   // empty array when none, not 404
```
**Errors**: 400 `VALIDATION_ERROR` (missing or unknown `type`); 401 `UNAUTHORIZED`; 403 `FORBIDDEN` (not an admin).

## PATCH /api/admin/content/:type/:id
Role: admin. Body `{ hidden: boolean }`. Idempotent: setting the current value returns 200.

**200** `AdminContentItem` (updated).
**Errors**: 400 `VALIDATION_ERROR` (unknown `type`, `hidden` not boolean); 401 `UNAUTHORIZED`; 403 `FORBIDDEN`; 404 `CONTENT_NOT_FOUND`.

## Realtime
None.

## Done when
- [ ] Reviewed against SCOPE.md and approved by a human (`status: done`)
