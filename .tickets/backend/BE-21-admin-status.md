---
id: BE-21
title: Admin — service status panel
status: review
depends_on: [BE-07, BE-09, BE-18]
contracts: [CT-25]
scope: §2 admin service status panel
owns:
  - apps/api/src/modules/admin/admin-status.*
  - apps/api/src/modules/admin/admin.routes.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
`GET /api/admin/status` (CT-25): five entries in the fixed order `API`, `Socket.io`, `MongoDB`, `Image storage`, `Swagger UI`.

## Checks
- API: always `operational`. Socket.io: `connectedSockets()` in `detail`. MongoDB: `db.admin().ping()` with latency. Image storage: `storage.ping()` (HeadBucket). Swagger UI: `fetch` of the local `/api-docs/` (`down` until BE-22 exists, which is correct).
- All checks run in parallel, each wrapped in one `timed(check, 2000)` helper: failure or timeout → `down` with `latencyMs: null`; slower than 1 s → `degraded`.

## Server rules
- The endpoint answers 200 even when a dependency is down.
- `detail` is a fixed short sentence chosen by the server. Never put an error message, host name, connection string or credential in it; log those server-side instead.
- The Swagger check targets `http://127.0.0.1:<port>` built from `config/env.ts`, never a URL from the request.

## Done when
- [x] With Mongo and Silo up: MongoDB and Image storage are `operational` with a latency
- [x] With a storage check stubbed to hang, the endpoint still answers in about 2 s with that service `down`
- [x] Non-admin tokens → 403
- [x] `verify` passes
