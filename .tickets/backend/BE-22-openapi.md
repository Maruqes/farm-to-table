---
id: BE-22
title: OpenAPI 3 spec and Swagger UI at /api-docs
status: review
depends_on: [BE-13, BE-16, BE-20, BE-21]
contracts: [CT-00 … CT-27]
scope: §1 API docs
owns:
  - apps/api/package.json
  - apps/api/package-lock.json
  - apps/api/src/docs/**
  - apps/api/src/app.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
- Dependency: `swagger-ui-express` (+ types).
- `docs/openapi.ts`: one hand-written OpenAPI 3 document exported as a typed object, split into one file per module under `docs/paths/` so no file is huge. `components.schemas` holds the contract types once (`User`, `ProductListItem`, `Order`, `AuctionRoom`, `Error`, ...); `components.securitySchemes.bearerAuth`; `security` on every non-public operation.
- Serve Swagger UI at `/api-docs` and the raw document at `/api-docs/openapi.json`.
- The contracts in `.tickets/contract/` are the source: copy shapes and status codes from them, do not invent.

## Server rules
- A test walks the Express router and fails when a mounted `/api` route is missing from the spec, or the spec lists a path that is not mounted. This keeps the document honest with no generator.
- helmet's CSP must still let Swagger UI load its own assets on `/api-docs` only; do not relax it for the rest of the app.

## Done when
- [x] Every line in `.tickets/contract/ENDPOINTS.md` has an operation in the spec
- [x] "Authorize" with a token from `POST /api/auth/login` makes a protected call succeed from the UI
- [x] `GET /api/admin/status` now reports Swagger UI as `operational`
- [x] `verify` passes
