---
id: CT-22
title: API contract — admin users list
status: done
depends_on: [FE-22]
source: [FE-22, SCOPE.md §2 admin]
consumers: [apps/web/src/features/admin/admin-users/admin-users.http.ts]
---
Follows CT-00 (envelope, errors, auth, dates). Frozen once a human sets `status: done`. Read-only: no endpoint here changes a user.

## GET /api/admin/users?q&role&page
Role: admin (Bearer token). All registered users, in a stable order across pages.

Query:
- `q` (optional) — case-insensitive substring of name or email.
- `role` (optional) — `buyer` | `producer` | `admin`.
- `page` (optional, default 1) — 1-based. Fixed page size of **8**.

**200**
```ts
interface AdminUser {
  id: string
  name: string
  email: string
  role: 'buyer' | 'producer' | 'admin'
  state: 'active' | 'pending' | 'suspended'   // pending = producer awaiting approval
}
interface Response {
  items: AdminUser[]   // empty array when no match, not 404; a page past the end is empty
  total: number        // matches across all pages
}
```
**Errors**: 400 `VALIDATION_ERROR` (unknown `role`, `page` not a positive integer); 401 `UNAUTHORIZED`; 403 `FORBIDDEN` (not an admin).

## Realtime
None.

## Done when
- [ ] Reviewed against SCOPE.md and approved by a human (`status: done`)
