---
id: CT-26
title: API contract — producers directory
status: done
depends_on: [FE-26]
source: [FE-26, SCOPE.md §0]
consumers: [apps/web/src/features/producer/producers-directory/producers-directory.http.ts, apps/web/src/features/producer/producers-directory/producers-directory.dto.ts]
---
Follows CT-00. Public endpoint (no token required; a token is ignored).

## Types
```ts
ProducerDirectoryItem = {
  id: string, name: string,
  location: string,        // human-readable place, e.g. "Douro, Portugal"; also the filter value
  averageRating: number,   // 0–5, 0 when no reviews
  productCount: number     // visible products, integer >= 0
}
```

## GET /api/producers?q&location
- Query (all optional): `q` case-insensitive substring of `name`; `location` exact match (case-insensitive) on `location`.
- Returns only approved producers whose page is not hidden, sorted by `name`. Not paginated.
- 200 `ProducerDirectoryItem[]` (may be empty)
- 400 `VALIDATION_ERROR` — `q` or `location` longer than 100 chars.

## Realtime
None.
