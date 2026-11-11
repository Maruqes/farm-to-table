---
id: BE-01
title: Auth — user model, register, login, JWT guards
status: done
depends_on: [BE-00]
contracts: [CT-00, CT-01, CT-02]
scope: §0 actors, §1 auth/security
owns:
  - apps/api/src/modules/users/users.model.ts
  - apps/api/src/modules/auth/**
  - apps/api/src/middleware/auth.ts
  - apps/api/package.json
  - apps/api/package-lock.json
verify: cd apps/api && npm run typecheck && npm test
---
## Build
- Dependencies: `bcrypt`, `jsonwebtoken`, `express-rate-limit` (+ types).
- `users.model.ts`: `name`, `email` (unique, stored lowercase and trimmed), `passwordHash` (`select: false`), `role` enum, `address` (default `""`), `card`, `cart`, and the embedded `producer` object from the README. Only the fields; other tickets add behaviour.
- `POST /api/auth/register`, `POST /api/auth/login` exactly as CT-01. bcrypt cost 12. JWT `{ sub, role }`, 2h, HS256.
- `middleware/auth.ts`: `requireAuth`, `requireRole(...roles)`, `requireApprovedProducer` (reads `producer.status` from the database), with the codes in the README. Verify with an explicit algorithm list.

## Server rules
- `role: "admin"` in a register body is a 400 field error; admins only come from the seed (BE-02).
- Login gives the same 401 `INVALID_CREDENTIALS` for unknown email and wrong password, and always runs a bcrypt compare so timing does not reveal which.
- Duplicate email is 400 with `fields.email` (CT-01), also when two registrations race (catch the unique-index error).
- Rate limit `/api/auth/*`: 10 requests per minute per IP → 429 `TOO_MANY_REQUESTS`.
- Password max length 72 (bcrypt limit) so a huge body cannot burn CPU.
- A new producer gets `producer.status = "pending"` and `producer.farmName` / `location` from `farmName` / `locality`.

## Done when
- [x] Register and login return `AuthResponse`; `producerStatus` only for producers
- [x] Token expired, malformed or signed with another secret → 401
- [x] `requireApprovedProducer` rejects a pending and a rejected producer with 403 `PRODUCER_NOT_APPROVED`
- [x] `passwordHash` never appears in any response (tested)
- [x] `verify` passes
