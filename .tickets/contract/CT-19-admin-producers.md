---
id: CT-19
title: API contract — admin producer approvals
status: done
depends_on: [FE-19]
source: [FE-19, SCOPE.md §0]
consumers: [apps/web/src/features/admin/admin-producers/admin-producers.http.ts]
---
Follows CT-00 (envelope, errors, auth, dates). Frozen once a human sets `status: done`.

## GET /api/admin/producers?status=pending
Role: admin (Bearer token). Lists producer accounts waiting for approval, newest application first.

**200**
```ts
interface PendingProducer {
  id: string
  name: string            // farm / business name
  email: string
  phone?: string
  location?: string
  bio?: string
  categories: string[]    // may be empty
  appliedAt: string       // ISO 8601, when the account was registered
  status: 'pending'
}
type Response = PendingProducer[]   // empty array when none, not 404
```
**Errors**: 401 `UNAUTHORIZED`; 403 `FORBIDDEN` (not an admin).

## POST /api/admin/producers/:id/approve
Role: admin. No body. Sets the producer's `producerStatus` to `approved`.

**200** — body ignored by the client.
**Errors**: 401 `UNAUTHORIZED`; 403 `FORBIDDEN`; 404 `PRODUCER_NOT_FOUND` (unknown id, or no longer pending).

## POST /api/admin/producers/:id/reject
Role: admin. Sets `producerStatus` to `rejected`.

**Request**
```ts
interface RejectProducerRequest {
  reason?: string   // trimmed, max 300 chars; omitted when blank
}
```
**200** — body ignored by the client.
**Errors**: 400 `VALIDATION_ERROR` (`fields.reason` when over 300 chars); 401 `UNAUTHORIZED`; 403 `FORBIDDEN`; 404 `PRODUCER_NOT_FOUND`.

## Realtime
None. The list loads once; a decided row is removed locally after 200.

## Done when
- [ ] Reviewed and approved by a human (`status: done`)
