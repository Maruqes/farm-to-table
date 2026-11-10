---
id: FE-00
title: Frontend foundation (shadcn, shell, mocks switch, realtime stub)
status: done
depends_on: []
route: "*"
roles: [all]
scope: "§1, §4"
owns:
  - apps/web/package.json
  - apps/web/package-lock.json
  - apps/web/vite.config.ts
  - apps/web/tsconfig*.json
  - apps/web/src/main.tsx
  - apps/web/src/app/**
  - apps/web/src/components/**
  - apps/web/src/context/**
  - apps/web/src/services/**
  - apps/web/src/styles/**
  - apps/web/src/pages/Home.tsx
  - .env.example
verify: cd apps/web && npm run lint && npm run build
---
## Do
- Install Tailwind + shadcn/ui with the `@/` alias. Stop importing Bootstrap and the SASS entry; leave the `bootstrap` dependency and `styles/*.scss` files in place, unused, for the final migration phase.
- App shell: header, role-aware nav, footer, responsive. UI copy in English.
- `app/routes.tsx`: one line per route; `RequireRole` guard (visitor, buyer, producer, admin).
- Session context with a mock login that sets the role, plus a dev role switcher.
- `services/`: keep `api.ts` as the only fetch wrapper; add the `VITE_USE_MOCKS` switch helper and a realtime client interface with a mock emitter (rooms `user:<id>`, `auction:<id>`). No `socket.io-client` yet.
- Shared: toaster, `PageState` (loading / empty / error), money (€) and date formatters.
- Header search box navigates to `/?q=<text>`; logout action; a 404 page for unknown routes.
- Add `VITE_USE_MOCKS=true` to `.env.example`.

## Done when
- [x] Dev server shows a shell with working role switch and guard redirects
- [x] A shadcn component renders; no Bootstrap CSS loaded
- [x] `verify` passes
