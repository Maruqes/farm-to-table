# apps/web — frontend guide

React + Vite + TS SPA, Tailwind + shadcn/ui, react-router. Product scope: [../../docs/SCOPE.md](../../docs/SCOPE.md) (anything not there is not built). Repo-wide rules: [../../AGENTS.md](../../AGENTS.md). Code, comments, docs, product text, API fields, states and socket events are all in English (`pending`, `active`, `order-updated`, ...); SCOPE.md is the source of truth.

## Work from tickets
- Work is defined in `.tickets/frontend/FE-nn-<page>.md`. Workflow and status flow are in the root [AGENTS.md](../../AGENTS.md) and `.tickets/README.md`.
- Read the ticket and the SCOPE.md sections it cites before coding. Do not build beyond the ticket.
- Each ticket's "Assumed API" section is a draft contract: mirror it in the feature's `*.dto.ts` and mocks.
- **Contract per finished ticket.** When a frontend ticket reaches `review`, write or extend its API contract in `.tickets/contract/` from what the page actually uses, not from the draft: one file per API module (`CT-nn-<module>.md`), `status: review`, `depends_on` the FE ticket. It lists every endpoint (method, path, auth/role, request body, response body with field types, status codes and error `code`s) and every realtime event the page consumes, and must match the ticket's `*.dto.ts` and mocks exactly. Cross-cutting rules (base path, auth header, error body, socket rooms) live in `CT-00-foundation.md`; follow them, don't repeat them. If the page needs to change an approved (`done`) contract, open a new contract ticket instead of editing it. Also tick (or add) each endpoint and event the page uses in `.tickets/contract/ENDPOINTS.md`, the master checklist, and add its page route(s) to `.tickets/frontend/ROUTES.md` (existing routes only). Delegated agents get this rule in their brief too.

## Mock data first, API-ready always
The API does not exist yet and, once it does, **its responses are a draft and will change**. The UI must never depend on raw API shapes.

- **Three layers per feature**, in `features/<name>/`:
  1. `*.dto.ts`: the API response shape as currently assumed (the OpenAPI sketch is the source). Every field may be missing or renamed later.
  2. `*.adapter.ts`: the only place that maps DTO → domain model. Defensive: default missing fields, ignore unknown ones, normalise dates/numbers/ids (`_id` vs `id`).
  3. Domain types in `types/`: what components and hooks consume. Components import domain types only, never DTOs.
- **One service interface per feature** (`catalog.service.ts` etc.) with two implementations: `*.mock.ts` and `*.http.ts` (via `services/api.ts`). The choice is made in one place from `VITE_USE_MOCKS`. Swapping to the real API must touch no component.
- **Mocks return DTO-shaped data**, not domain objects, so the adapters run in mock mode too. Fixtures live in `features/<name>/mocks/`, with realistic content (real producer and place names are fine as proper nouns; all UI text is English), deterministic ids. Mocks simulate latency and, at least once per feature, an error and an empty result.
- **Real time** (notifications, auctions) goes behind a small client interface; the mock implementation emits fake events on a timer. No `socket.io-client` calls outside that module.
- Every data-loading screen handles loading, empty, error and success. No unhandled `undefined` from the data layer.
- The server is the source of truth for auctions and order states: the client may show optimistic UI but must accept the server state when it differs.

## Conventions
- **For frontend rules see [RULES.md](RULES.md)**; it wins over DESIGN.md wherever they disagree.
- **Visual style: follow [DESIGN.md](DESIGN.md) and use the `/ui-ux-pro-max`, `/impeccable` and `/ui-unslop` skills for every UI change** (see "UI style and delegation" in the root AGENTS.md). Same rule for anything you delegate.
- Mobile first with Tailwind (`md` 768 / `lg` 1024 / `xl` 1280 to match SCOPE.md). shadcn/ui components first; add new ones with the shadcn CLI.
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
