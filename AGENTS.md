# Farm to Table — agent & contributor guide

Marketplace for local producers with live auctions. **Scope source of truth: [docs/SCOPE.md](docs/SCOPE.md)** — anything not there is not built. **Everything is in English**: code, comments, docs, UI text, frontend routes (`/producers`, `/auctions`, `/cart`), API field names, enum/state values (`pending`, `active`) and socket event names. Proper nouns (producer and place names) are the only non-English data.

## Layout

```
apps/
  web/         React + Vite + TS SPA, react-router. Built now with Tailwind + shadcn/ui; migrated to Bootstrap 5 + SASS (SCOPE.md §1) in a final, separate phase
  api/         Express + TS REST, Mongoose, Socket.io
  backoffice/  Laravel 13 admin (bonus), mongodb/laravel-mongodb, same Mongo as the API
infra/
  k8s/         Kubernetes manifests (later)
docs/          SCOPE.md (requirements), add ADRs/report notes here
.tickets/      work orders, one markdown file each (see "Work from tickets")
compose.yaml       production-like stack (web, api, backoffice, mongo); nginx in web proxies /api, /api-docs, /socket.io
compose.dev.yaml   dev override: hot reload + exposed DB ports
.env.example       the single env file for all apps: copy to .env
```

### apps/api/src
`app.ts` Express app (no listen) · `server.ts` HTTP + Socket.io · `config/env.ts` the only place reading env vars · `db/` Mongo connection · `middleware/` auth (JWT), roles, errors · `realtime/` socket rooms (`auction:<id>`, `user:<id>`) · `docs/` OpenAPI spec · `modules/<feature>/` per feature: model, routes, controller, service (`auth users products orders auctions reviews`).

### apps/backoffice
Standard Laravel layout. Models extend `MongoDB\Laravel\Eloquent\Model`; sessions/cache are file-based (no SQL database).

### apps/web/src
`main.tsx` entry · `app/` App + router · `pages/` route components · `features/<name>/` feature UI + logic (`catalog cart orders auctions producer admin auth`) · `components/` shared UI · `context/` session + cart · `hooks/` (e.g. `useAuction`) · `services/api.ts` the only fetch wrapper · `styles/` global CSS (the old SASS partials stay untouched until the Bootstrap phase) · `types/`.

## Commands
```bash
cp .env.example .env     # the only env file, read by every app via compose (fill BACKOFFICE_APP_KEY, S3_*)
make dev        # hot reload: web :5173, api :3000, backoffice :8081, mongo :27017, silo :9000 (console :9001)
make up         # production-like, detached: web :8080
```
Outside Docker: `cd apps/api && node --env-file=../../.env --import tsx src/server.ts` (set `MONGO_URL` to a reachable Mongo); web: `npm install && npm run dev`.

## Work from tickets
Work orders live in `.tickets/` (format and status flow: `.tickets/README.md`). Frontend tickets are one file per page in `.tickets/frontend/`.
1. Pick a `todo` ticket whose `depends_on` are all `done`. Set `status: doing`.
2. Read the ticket and the SCOPE.md sections it cites. Build only what it says; touch only the paths in `owns` (plus its one route line in `app/routes.tsx`).
3. Run the ticket's `verify` command. Tick the acceptance boxes, set `status: review`.
   Keep the two master lists current in the same change: `.tickets/frontend/ROUTES.md` lists every route that exists in `app/routes.tsx` (add yours, nothing planned); `.tickets/contract/ENDPOINTS.md` lists every API endpoint and realtime event (tick the ones the page uses, add missing ones, fill in the contract id).
4. Finish with a short report: files changed, what you skipped or could not verify, open questions. Never edit other tickets silently.

## UI style and delegation (IMPORTANT)
**Every frontend change, by any agent, must look like it was made by the same designer.** The visual source of truth is [apps/web/DESIGN.md](apps/web/DESIGN.md) (direction, tokens, type, layout rules, banned patterns) and the tokens in `apps/web/src/styles/globals.css`; do not invent new colours, fonts, radii or one-off styles per page. Any agent building or changing UI must use these three skills: **`/ui-ux-pro-max`** for UX rules (accessibility, touch targets, forms, navigation), **`/impeccable`** for craft and its quality floor (states, focus, contrast, no eyebrows/gradient text/card soup), and **`/ui-unslop`** as a final pass to remove generic AI styling before the ticket goes to `review`. When you delegate UI work to another agent (opencode, subagents or other sessions), the brief must say so explicitly: tell it to read `apps/web/DESIGN.md` first, to load and apply those three skills (or, if it cannot load skills, to follow DESIGN.md's rules and its "Banned" list to the letter), to reuse existing shadcn components and `PageState`, and to report any place it had to deviate. The delegating agent reviews the rendered result against DESIGN.md, desktop and 375px, and sends it back until it matches; a ticket whose UI drifts from the system is not done, even if lint and build pass.

## Rules
- Web phase order: UI on mock data → API contract gated → backend tickets → swap mocks for the real API per feature → Bootstrap migration last. Never skip ahead.
- Mocks sit behind the service layer (see `apps/web/AGENTS.md`); components never import fixtures or call `fetch`.
- The API shapes assumed in a frontend ticket are a draft. They become the contract only after review; change a frozen contract only through a contract ticket.
- Bootstrap lives in `apps/backoffice` and, at the end, in the web migration phase. Do not mix it with shadcn/Tailwind in the same screen.
- Each app is self-contained (own `package.json`, lockfile, Dockerfile). No shared package yet; duplicate types until it hurts.
- Server is the source of truth for auctions (atomic `findOneAndUpdate`, see SCOPE.md §3).
- Secrets only via env vars; never commit `.env`.
- Put new code in the folder named for its feature; don't add top-level folders without updating this file.
