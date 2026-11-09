# apps/web — frontend guide

React + Vite + TS SPA, Bootstrap 5 + SASS, react-router. Product scope: [../../docs/SCOPE.md](../../docs/SCOPE.md) (anything not there is not built). Repo-wide rules: [../../AGENTS.md](../../AGENTS.md). Code, comments and docs in English; product text and states follow SCOPE.md (`pendente`, `ativo`, ...).

## Work from tickets
- Work is defined in `.tickets/TICKETnn.md`. Do one ticket at a time, in number order unless `Depends on` allows otherwise.
- Read the ticket and the SCOPE.md sections it cites before coding. Do not build beyond the ticket.
- When done: tick the acceptance boxes and set `Status: done` in the ticket. Do not edit other tickets without saying so.

## Mock data first, API-ready always
The API does not exist yet and, once it does, **its responses are a draft and will change**. The UI must never depend on raw API shapes.

- **Three layers per feature**, in `features/<name>/`:
  1. `*.dto.ts`: the API response shape as currently assumed (the OpenAPI sketch is the source). Every field may be missing or renamed later.
  2. `*.adapter.ts`: the only place that maps DTO → domain model. Defensive: default missing fields, ignore unknown ones, normalise dates/numbers/ids (`_id` vs `id`).
  3. Domain types in `types/`: what components and hooks consume. Components import domain types only, never DTOs.
- **One service interface per feature** (`catalog.service.ts` etc.) with two implementations: `*.mock.ts` and `*.http.ts` (via `services/api.ts`). The choice is made in one place from `VITE_USE_MOCKS`. Swapping to the real API must touch no component.
- **Mocks return DTO-shaped data**, not domain objects, so the adapters run in mock mode too. Fixtures live in `features/<name>/mocks/`, in Portuguese realistic content, deterministic ids. Mocks simulate latency and, at least once per feature, an error and an empty result.
- **Real time** (notifications, auctions) goes behind a small client interface; the mock implementation emits fake events on a timer. No `socket.io-client` calls outside that module.
- Every data-loading screen handles loading, empty, error and success. No unhandled `undefined` from the data layer.
- The server is the source of truth for auctions and order states: the client may show optimistic UI but must accept the server state when it differs.

## Conventions
- Mobile first; `min-width` breakpoints 768 / 1024 / 1280 via the `up()` mixin in `styles/_mixins.scss`. Tokens in `styles/_variables.scss`, Bootstrap overrides before the Bootstrap import.
- Semantic HTML (`header`, `nav`, `main`, `article`), labelled form controls, visible focus, keyboard-operable.
- Routes in `app/`, one component per route in `pages/`, feature logic in `features/<name>/`, shared UI in `components/`, session/cart in `context/`.
- `services/api.ts` is the only `fetch` wrapper (base URL, JWT header, error normalisation to one `ApiError`).
- Each app is self-contained: duplicate types from the API rather than sharing a package.
- Secrets never in the bundle. Only `VITE_*` public config.

## Commands
```bash
npm install
npm run dev      # vite :5173
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```
Run `lint` and `build` before closing a ticket.
