---
id: FE-19
title: Producer approvals
status: doing
depends_on: [FE-01]
route: /admin/producers
roles: [admin]
scope: §0 admin
owns:
  - apps/web/src/pages/AdminProducersPage.tsx
  - apps/web/src/features/admin/admin-producers/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Pending producers list with approve / reject (reject reason optional); confirm dialog.

## Assumed API (draft)
- `GET /api/admin/producers?status=pending` → 200 [...]
- `POST /api/admin/producers/:id/approve` and `/reject` → 200

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
