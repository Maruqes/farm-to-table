# Farm to Table — agent & contributor guide

Marketplace for local producers with live auctions. **Scope source of truth: [docs/SCOPE.md](docs/SCOPE.md)** — anything not there is not built. Code, comments and docs are in English; product text and API paths follow SCOPE.md (Portuguese states such as `pendente`, `ativo`).

## Layout

```
apps/
  web/         React + Vite + TS SPA, Bootstrap 5 + SASS, react-router
  api/         Express + TS REST, Mongoose, Socket.io
  backoffice/  Laravel 13 admin (bonus), mongodb/laravel-mongodb, same Mongo as the API
infra/
  k8s/         Kubernetes manifests (later)
docs/          SCOPE.md (requirements), add ADRs/report notes here
compose.yaml       production-like stack (web, api, backoffice, mongo); nginx in web proxies /api, /api-docs, /socket.io
compose.dev.yaml   dev override: hot reload + exposed DB ports
.env.example       the single env file for all apps: copy to .env
```

### apps/api/src
`app.ts` Express app (no listen) · `server.ts` HTTP + Socket.io · `config/env.ts` the only place reading env vars · `db/` Mongo connection · `middleware/` auth (JWT), roles, errors · `realtime/` socket rooms (`auction:<id>`, `user:<id>`) · `docs/` OpenAPI spec · `modules/<feature>/` per feature: model, routes, controller, service (`auth users products orders auctions reviews`).

### apps/backoffice
Standard Laravel layout. Models extend `MongoDB\Laravel\Eloquent\Model`; sessions/cache are file-based (no SQL database).

### apps/web/src
`main.tsx` entry · `app/` App + router · `pages/` route components · `features/<name>/` feature UI + logic (`catalog cart orders auctions producer admin auth`) · `components/` shared UI · `context/` session + cart · `hooks/` (e.g. `useAuction`) · `services/api.ts` the only fetch wrapper · `styles/` SASS (`_variables`, `_mixins`, `main.scss`) · `types/`.

## Commands
```bash
cp .env.example .env     # the only env file, read by every app via compose (fill BACKOFFICE_APP_KEY, S3_*)
make dev        # hot reload: web :5173, api :3000, backoffice :8081, mongo :27017, silo :9000 (console :9001)
make up         # production-like, detached: web :8080
```
Outside Docker: `cd apps/api && node --env-file=../../.env --import tsx src/server.ts` (set `MONGO_URL` to a reachable Mongo); web: `npm install && npm run dev`.

## Rules
- Each app is self-contained (own `package.json`, lockfile, Dockerfile). No shared package yet; duplicate types until it hurts.
- Server is the source of truth for auctions (atomic `findOneAndUpdate`, see SCOPE.md §3).
- Secrets only via env vars; never commit `.env`.
- Put new code in the folder named for its feature; don't add top-level folders without updating this file.
