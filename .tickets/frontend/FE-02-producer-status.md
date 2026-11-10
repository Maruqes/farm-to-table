---
id: FE-02
title: Producer waiting / rejected page
status: done
depends_on: [FE-01]
route: /producer/status
roles: [producer]
scope: §0 actors
owns:
  - apps/web/src/pages/ProducerStatusPage.tsx
  - apps/web/src/features/auth/producer-status/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Producer not approved sees only this page: "waiting for approval" or "rejected" message with logout.
- Guard: a pending or rejected producer is redirected here from every producer route.

## Assumed API (draft)
- Uses the session user's `producerStatus`; no extra endpoint.

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [x] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
