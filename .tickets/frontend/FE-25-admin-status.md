---
id: FE-25
title: Service status panel
status: done
depends_on: [FE-01]
route: /admin/status
roles: [admin]
scope: §2 status panel
owns:
  - apps/web/src/pages/AdminStatusPage.tsx
  - apps/web/src/features/admin/admin-status/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- One card per service (API, Socket.io, MongoDB, Image storage, Swagger UI) with `operational` / `degraded` / `down`, a short detail and latency; auto-refresh every 15 s.

## Assumed API (draft)
- `GET /api/admin/status` → 200 [{service, status, detail, latencyMs}]

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
