# Tickets

One markdown file per work order. The folder is the board; git is the history.

```
.tickets/
  frontend/   FE-nn-<page>.md   one per page (UI on mock data)
  contract/   later: one per API module, gate before backend work
  backend/    later: one per module, created from a frozen contract
```

## Format
Frontmatter: `id`, `title`, `status`, `depends_on`, `route`, `roles`, `scope` (SCOPE.md sections), `owns` (paths this ticket may touch), `verify` (command that must pass). Body: screens & states, assumed API (draft contract), done-when checklist.

## Status flow
`todo` → `doing` → `review` → `done`. The agent sets `doing` and `review`; a human (or reviewer agent) sets `done`.

## Parallel rules
- Start a ticket only when every `depends_on` is `done`.
- Two tickets running at the same time never share an `owns` path.
- Data-layer files are named after the entity (`orders.service.ts`, `orders.dto.ts`, `mocks/`). A ticket creates an entity's files if missing and extends them otherwise; tickets touching the same entity are ordered with `depends_on`.
- Every ticket may add exactly one line to `app/routes.tsx` (kept one-line-per-route so merges stay trivial).
- Never edit lockfiles, `package.json` or shared files unless the ticket owns them (FE-00 does).

## Phases
1. FE-00 foundation, then pages on mock data (UI copy and routes in English, mock content realistic).
2. Each ticket's "Assumed API" is reviewed against SCOPE.md and becomes the contract.
3. Backend tickets implement it; mocks are swapped for the real API per feature.
4. Final, separate phase: web migration to Bootstrap 5 + SASS (SCOPE.md §1).
