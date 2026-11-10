---
description: Build the next frontend ticket with opencode agents, review it, write its API contract, and leave it in review
argument-hint: "[FE-nn] (optional; defaults to the next ready ticket)"
---

Run the next frontend ticket end to end for Farm to Table. You are the orchestrator and reviewer; opencode agents do the building. Everything you and the agents write is English: code, UI text, routes, API fields, states, events, docs.

## 0. Read first
`AGENTS.md`, `apps/web/AGENTS.md`, `apps/web/DESIGN.md`, `.tickets/README.md`, `.tickets/contract/CT-00-foundation.md`.

## 1. Pick the ticket
- If `$ARGUMENTS` names a ticket, use it. Otherwise pick the lowest-numbered `.tickets/frontend/FE-*.md` with `status: todo` whose `depends_on` are all `done`.
- If a ticket is already `doing` or `review`, stop and tell the user (one ticket at a time). If none is ready, say which dependencies block the next one and stop.
- Read the ticket, the SCOPE.md sections it cites, and the contracts in `.tickets/contract/` it relies on. Set `status: doing`.

## 2. Delegate the build (opencode only)
- Use the opencode `agent` tool with `model: opencode-go/deepseek-v4.1-flash` and nothing else. Never build the ticket yourself and never use Claude subagents for it.
- Decide how many agents from difficulty. Simple page: 1 agent. Larger ticket: split by non-overlapping files (e.g. data layer `dto/adapter/service/mock` vs. UI components), run the data layer first when the UI depends on it. Two agents never touch the same file.
- Every brief is self-contained and must include:
  - the ticket path and its `owns` list (touch nothing else, plus one line in `app/routes.tsx`);
  - read `apps/web/AGENTS.md` and `apps/web/DESIGN.md` first; load and apply the `/ui-ux-pro-max`, `/impeccable` and `/ui-unslop` skills, or if skills can't load, follow DESIGN.md and its "Banned" list to the letter; reuse shadcn components and `PageState`;
  - the three-layer data rule (dto → adapter → domain types), mocks behind the service, `VITE_USE_MOCKS`, loading/empty/error states;
  - all English: UI copy, routes, fields, states;
  - follow `CT-00-foundation.md` and fix any CT-00 "Gaps" in files the ticket owns;
  - add the route line(s) it registers in `app/routes.tsx` to `.tickets/frontend/ROUTES.md` (route, roles/guard, ticket);
  - verify: `cd apps/web && npm run lint && npm run build`;
  - 2–6 numbered tasks, ending with: "Before any other work, call todowrite with exactly these tasks. Keep exactly one in_progress, and mark each completed as soon as it is done."
- If an agent ends with a `QUESTION:`, ask the user with AskUserQuestion (agent's options, its first as recommended) and relay the answer with `send_message` to the same agent.

## 3. Review and iterate
- Read the diff (`git status`, `git diff`, new files). Check: only `owns` paths touched; layers respected; no fetch/fixtures in components; all states handled; all English; DESIGN.md followed, nothing from "Banned".
- Run `npm run lint && npm run build` yourself.
- Start the dev server and check the route in the browser at desktop and 375px, as each role the ticket covers, including loading, empty and error.
- Run `sh ~/.claude/skills/impeccable/scripts/impeccable detect --json <changed UI files>`.
- Anything wrong: `send_message` to the same agent with concrete fixes. Repeat until clean. Don't patch it yourself except a one-line trivial fix.

## 4. Write the contract
- From what the page actually uses (its `*.dto.ts`, mocks and service), create or extend `.tickets/contract/CT-nn-<module>.md` per `apps/web/AGENTS.md` ("Contract per finished ticket"): every endpoint (method, path, role, request, response with types, status codes, error codes) and every realtime event, `status: review`, `depends_on` the FE ticket. Follow CT-00; don't repeat it.
- You may delegate the draft to an opencode agent, but you check it line by line against the DTOs and mocks.
- Never edit a contract with `status: done`; open a new contract ticket instead.
- Update `.tickets/frontend/ROUTES.md`: add a line for every route the ticket registered in `app/routes.tsx` (route, roles/guard, ticket). It lists only routes that exist.
- Update `.tickets/contract/ENDPOINTS.md` (the master endpoint checklist): for every endpoint and realtime event the page actually calls or consumes, tick its `[ ]`, add the FE ticket if missing and fill in the contract id. Add a line for any endpoint or event the page uses that is not listed yet, in the right section. If the page uses none, say so in the report. Never delete a line.

## 5. Close
- Tick the ticket's "Done when" boxes that you verified, set `status: review`. Do not set `done` (the user does) and do not commit unless asked.
- Report briefly: ticket, agents used and rounds of fixes, files changed, contract file written, routes added to ROUTES.md, endpoints ticked or added in ENDPOINTS.md, what you could not verify, open questions.
