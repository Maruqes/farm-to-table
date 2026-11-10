---
id: CT-16
title: API contract — producer reviews
status: review
depends_on: [FE-16]
source: [FE-16, SCOPE.md §0 ratings]
consumers: [apps/web/src/features/producer/producer-reviews/producer-reviews.http.ts, apps/web/src/features/producer/producer-reviews/producer-reviews.dto.ts]
---
Follows CT-00. Both endpoints need a `producer` token (401 `UNAUTHORIZED`, 403 `FORBIDDEN` for other roles).

## Types
```ts
ProducerReview = {
  id: string,
  author: string,           // buyer display name
  rating: number,           // integer 1–5
  text: string,
  product: string | null,   // product name; null = review of the producer's page
  reported: boolean
}
```

## GET /api/reviews?producer=me
- 200 `ProducerReview[]` — reviews on the producer's products and page, newest first; `[]` when none.

## POST /api/reviews/:id/report
- Request `{ reason: string }` — free text, 1–300 chars; the web sends the chosen reason label, e.g. `"Spam or advertising"`, optionally followed by `": <detail>"` (detail ≤ 200 chars).
- 200 `ProducerReview` — the review with `reported: true`. Reporting an already reported review is idempotent (200).
- 400 `VALIDATION_ERROR` — missing or invalid reason.
- 403 `FORBIDDEN` — review is not on this producer's products or page.
- 404 `REVIEW_NOT_FOUND`.

## Realtime
None.
