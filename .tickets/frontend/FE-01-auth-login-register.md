---
id: FE-01
title: Login and register
status: done
depends_on: [FE-00]
route: /login, /register
roles: [visitor]
scope: §0 actors, §6 auth
owns:
  - apps/web/src/pages/AuthPage.tsx
  - apps/web/src/features/auth/auth-login-register/**
  - apps/web/src/context/session.ts          # added by orchestrator: real login/register sets user + token
  - apps/web/src/context/SessionProvider.tsx # same
  - apps/web/src/services/api.ts             # CT-00 gap: Bearer token + ApiError
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Login form; register form with a buyer / producer choice (producer adds farm name and locality).
- Validation errors per field, wrong-credentials error, submitting state.
- After login: buyer → home, producer → dashboard (or status page if not approved), admin → overview.

## Assumed API (draft)
- `POST /api/auth/register` {name, email, password, role, ...} → 201 {user, token}
- `POST /api/auth/login` {email, password} → 200 {user, token}; 400 / 401 errors
- user: {id, name, email, role: buyer|producer|admin, producerStatus?: pending|approved|rejected}

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [x] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
