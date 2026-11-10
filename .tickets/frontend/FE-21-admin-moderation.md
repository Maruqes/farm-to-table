---
id: FE-21
title: Content moderation
status: todo
depends_on: [FE-01]
route: /admin/moderation
roles: [admin]
scope: §2 moderate content
owns:
  - apps/web/src/pages/AdminModerationPage.tsx
  - apps/web/src/features/admin/admin-moderation/**
verify: cd apps/web && npm run lint && npm run build
---
## Screens & states
- Tabs for products and producer pages; hide / unhide toggle. Text is never editable here.

## Assumed API (draft)
- `GET /api/admin/content?type=product|producer` → 200 [{id, name, hidden}]
- `PATCH /api/admin/content/:type/:id` {hidden} → 200

## Done when
- [ ] Everything above works in mock mode (`VITE_USE_MOCKS=true`), including loading, empty and error states
- [ ] Route registered in `app/routes.tsx` with the right role guard
- [ ] Usable at 375 / 768 / 1280 px and by keyboard
- [ ] `verify` passes
