---
id: CT-25
title: API contract — admin service status
status: done
depends_on: [FE-25]
source: [FE-25, SCOPE.md §2 status panel]
consumers: [apps/web/src/features/admin/admin-status/admin-status.http.ts]
---
Follows CT-00 (envelope, errors, auth, dates). Frozen once a human sets `status: done`. Read-only; the page polls it every 15 s.

## GET /api/admin/status
Role: admin (Bearer token). One entry per checked service, in a stable order: `API`, `Socket.io`, `MongoDB`, `Image storage`, `Swagger UI`.

**200**
```ts
interface ServiceStatus {
  service: string                              // display name, e.g. "MongoDB"
  status: 'operational' | 'degraded' | 'down'
  detail: string                               // one short English sentence
  latencyMs: number | null                     // integer >= 0; null when the service did not answer
}
type Response = ServiceStatus[]                // empty array is allowed, not 404
```
The endpoint itself answers 200 even when a dependency is `down`; a dependency failure is reported in its entry, not as an HTTP error.

**Errors**: 401 `UNAUTHORIZED`; 403 `FORBIDDEN` (not an admin); 500 `INTERNAL_ERROR`.

## Realtime
None (polled).

## Done when
- [ ] Reviewed against SCOPE.md and approved by a human (`status: done`)
