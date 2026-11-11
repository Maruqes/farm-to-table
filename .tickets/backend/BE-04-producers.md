---
id: BE-04
title: Producers — directory, public page, edit own page
status: done
depends_on: [BE-01]
contracts: [CT-05, CT-17, CT-26]
scope: §0 visitor and producer screens, §2
owns:
  - apps/api/src/modules/producers/producers.schemas.ts
  - apps/api/src/modules/producers/producers.service.ts
  - apps/api/src/modules/producers/producers.controller.ts
  - apps/api/src/modules/producers/producers.routes.ts
  - apps/api/src/modules/producers/producers.test.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
- `GET /api/producers?q&location` and `GET /api/producers/:id` (public), `GET /api/producers/me` and `PUT /api/producers/me` (approved producer).
- Register `/me` before `/:id`.
- No producer model: producers are `users` with `role: "producer"` (README).

## Server rules
- Public endpoints return only producers with `producer.status = "approved"` and `producer.hidden != true`; anything else is 404 `PRODUCER_NOT_FOUND`. Never include `email`.
- `products` and `productCount` come from the products service once BE-05 exists; until then return `[]` / `0` behind one service function that BE-05 fills in.
- `q` is escaped before `$regex`; `location` is an exact case-insensitive match.
- `photoUrl` must parse as a URL with protocol `http:` or `https:` (blocks `javascript:` and `data:`). `lat` and `lng` are both set or both null, within range.
- `name` is read-only here; `status` and `hidden` in the body are ignored.

## Done when
- [x] Pending, rejected and hidden producers are absent from the list and 404 on the page
- [x] `PUT /producers/me` change is visible on `GET /producers/:id`
- [x] Buyer on `/producers/me` → 403 `FORBIDDEN`; pending producer → 403 `PRODUCER_NOT_APPROVED`
- [x] `verify` passes
