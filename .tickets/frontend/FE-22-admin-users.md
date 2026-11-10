---
id: FE-22
title: Users list
status: done
depends_on: [FE-01]
route: /admin/users
roles: [admin]
scope: §2 admin
owns:
  - apps/web/src/pages/AdminUsersPage.tsx
  - apps/web/src/features/admin/admin-users/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Searchable, paginated table of users with role and state. Read-only.

## Assumed API (draft)
- `GET /api/admin/users?q&role&page` → 200 {items:[...], total}

## Done when
- [x] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [x] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [x] `verify` passes
