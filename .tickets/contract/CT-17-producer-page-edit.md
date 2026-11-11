---
id: CT-17
title: API contract — edit public producer page
status: done
depends_on: [FE-17]
source: [FE-17, SCOPE.md §0 producer screens, §1 maps]
consumers: [apps/web/src/features/producer/producer-page-edit/producer-page-edit.http.ts, apps/web/src/features/producer/producer-page-edit/producer-page-edit.dto.ts]
---
Follows CT-00. Both endpoints need a `producer` token (401 `UNAUTHORIZED`, 403 `FORBIDDEN` for other roles). `GET /api/producers/me` must be matched before `GET /api/producers/:id` (CT-05).

## Types
```ts
ProducerPage = {
  id: string,
  name: string,             // from the account, read-only here
  bio: string,              // may be "", max 600 chars
  location: string,         // human-readable place, e.g. "Douro, Portugal"; "" on a new page
  lat?: number,             // -90..90; omitted when unknown
  lng?: number,             // -180..180; omitted when unknown
  photoUrl?: string         // http(s) URL; omitted when none
}
SaveProducerPageRequest = {
  bio: string,              // trimmed, max 600
  location: string,         // trimmed, required (non-empty)
  lat: number | null,       // null clears; must be paired with lng
  lng: number | null,       // null clears; must be paired with lat
  photoUrl: string          // "" clears; otherwise http(s) URL
}
```

## GET /api/producers/me
- 200 `ProducerPage` — a new producer gets blank `bio`/`location` and no `lat`/`lng`/`photoUrl`.

## PUT /api/producers/me
- Body `SaveProducerPageRequest`
- 200 `ProducerPage` (updated); the change is visible on `GET /api/producers/:id`.
- 400 `VALIDATION_ERROR` with `fields` keyed by `bio | location | lat | lng | photoUrl`.

## Realtime
None.
