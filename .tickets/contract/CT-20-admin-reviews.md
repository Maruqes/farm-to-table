---
id: CT-20
title: API contract — admin reported reviews
status: review
depends_on: [FE-20]
source: [FE-20, SCOPE.md §0 ratings]
consumers: [apps/web/src/features/admin/admin-reviews/admin-reviews.http.ts]
---
Follows CT-00 (envelope, errors, auth, dates). Frozen once a human sets `status: done`.

## GET /api/admin/reviews?reported=true
Role: admin (Bearer token). Reviews with an open report, plus reviews already hidden by moderation, newest report first.

**200**
```ts
interface AdminReview {
  id: string
  author: string            // buyer display name
  rating: number            // 1–5
  text: string
  product: string | null    // product name; null when the review is about the producer page
  producer: string | null   // producer name
  createdAt: string         // ISO 8601
  report: {
    reason: string          // code (spam | offensive | unrelated | misleading | other) or the free-text reason sent by POST /api/reviews/:id/report (CT-16)
    note?: string
    reportedAt: string      // ISO 8601
  }
  status: 'reported' | 'hidden'
}
type Response = AdminReview[]   // empty array when none, not 404
```
**Errors**: 401 `UNAUTHORIZED`; 403 `FORBIDDEN` (not an admin).

## POST /api/admin/reviews/:id/keep
Role: admin. No body. Dismisses the report; the review stays public and leaves the queue.

**200** `AdminReview` (client drops it from the list).
**Errors**: 401 `UNAUTHORIZED`; 403 `FORBIDDEN`; 404 `REVIEW_NOT_FOUND` (unknown id, or no longer in the queue).

## POST /api/admin/reviews/:id/hide
Role: admin. No body. Hides the review: it disappears from public pages and from the average rating (SCOPE.md §0).

**200** `AdminReview` with `status: 'hidden'` (client keeps it in the list, marked Hidden).
**Errors**: 401 `UNAUTHORIZED`; 403 `FORBIDDEN`; 404 `REVIEW_NOT_FOUND`.

## Realtime
None. Reviewers are not notified (SCOPE.md §0).

## Done when
- [ ] Reviewed and approved by a human (`status: done`)
