---
id: BE-02
title: Seed — admin account and base test users
status: done
depends_on: [BE-01]
contracts: [CT-01]
scope: §0 actors (admin created by seeding)
owns:
  - apps/api/src/db/seed.ts
  - apps/api/package.json
  - .env.example
verify: cd apps/api && npm run typecheck && npm run seed && npm run seed
---
## Build
- `npm run seed` (`tsx src/db/seed.ts`): upserts by email one admin, one buyer, one approved producer and one pending producer. Running it twice changes nothing.
- Passwords come from `SEED_ADMIN_PASSWORD` and `SEED_USER_PASSWORD` in the root `.env` (add both to `.env.example`, empty). The script fails with a clear message when they are missing; no password is hard-coded or printed.
- Read the env values through `config/env.ts`.

## Done when
- [x] The seeded admin can log in through `POST /api/auth/login` and gets `role: "admin"`
- [x] Second run creates no duplicates
- [x] `verify` passes (needs Mongo from `make dev`)
