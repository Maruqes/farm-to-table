---
id: BE-00
title: API foundation — db, env, errors, validation, test harness
status: done
depends_on: []
contracts: [CT-00]
scope: §1, §6
owns:
  - apps/api/package.json
  - apps/api/package-lock.json
  - apps/api/src/app.ts
  - apps/api/src/server.ts
  - apps/api/src/config/env.ts
  - apps/api/src/db/**
  - apps/api/src/lib/**
  - apps/api/src/middleware/errors.ts
  - apps/api/src/middleware/validate.ts
  - apps/api/src/foundation.test.ts
  - compose.dev.yaml
  - CLAUDE.md
verify: cd apps/api && npm run typecheck && npm test
---
Read `.tickets/backend/README.md` first; it is the convention every later ticket relies on.

## Build
- Dependencies: `zod`, `helmet`. Nothing else here. Add the `test` script from the README.
- `config/env.ts`: add `nodeEnv`, `s3` (`endpoint`, `bucket`, `accessKey`, `secretKey`). In production, refuse to start when `JWT_SECRET` is missing or still the dev default.
- `db/connect.ts`: one `connect()` / `disconnect()`; `server.ts` connects before `listen`. A global Mongoose plugin exposes `id` and removes `_id` / `__v` from JSON.
- `lib/api-error.ts`: `ApiError(status, code, message, fields?)`. `lib/escape-regex.ts`. `lib/money.ts` (`round2`).
- `middleware/validate.ts`: `validate({ body?, query?, params? })` runs zod schemas, replaces the request values with the parsed ones, and throws 400 `VALIDATION_ERROR` with `fields` keyed by the first path segment.
- `middleware/errors.ts`: 404 `NOT_FOUND` for unknown `/api` routes; one error handler that prints the CT-00 body. Malformed JSON → 400 `VALIDATION_ERROR`; anything unexpected → 500 `INTERNAL_ERROR` with a generic message, details only in the server log.
- `app.ts`: `helmet()`, `express.json({ limit: '100kb' })`, routers, then 404 and the error handler. Keep `GET /api/health`.
- `compose.dev.yaml`: nothing new unless the api service lacks an env var the above needs.
- `CLAUDE.md`: update the `apps/api/src` line with the module list and `lib/` from the README.

## Done when
- [x] Unknown route, bad JSON and a thrown `ApiError` all answer with the CT-00 error body (tested)
- [x] A thrown plain `Error` answers 500 without its message or stack
- [x] `npm test` runs against `farm_to_table_test` and never touches the dev database
- [x] `verify` passes
