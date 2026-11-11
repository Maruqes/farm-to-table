---
id: BE-09
title: Realtime — socket handshake, rooms, viewer count
status: done
depends_on: [BE-01]
contracts: [CT-00, CT-11]
scope: §3, §4
owns:
  - apps/api/src/realtime/**
  - apps/api/package.json
  - apps/api/package-lock.json
  - apps/api/src/server.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
- Dev dependency: `socket.io-client` (tests only).
- `realtime/socket.ts`: `attach(io)`. Handshake reads `auth.token`; a valid JWT joins `user:<sub>` automatically, no token is a visitor, an **invalid or expired token is refused** (connection error), not downgraded to visitor.
- Client events `join` / `leave` with `{ room }`: only rooms matching `auction:<ObjectId>` are accepted. A client can never join a `user:` room by asking.
- `viewers` event `{ auctionId, count }` to the room on every join, leave and `disconnecting`. Count = sockets in the room.
- `realtime/emit.ts`: `emitToUser(userId, event, payload)`, `emitToAuction(auctionId, event, payload)`, `viewerCount(auctionId)`, `connectedSockets()`. Modules import only this file, never `io`.
- Move the `io` creation out of the `server.ts` export so importing `app` in tests does not open a port.

## Server rules
- Clients cannot emit server events: there are no handlers besides `join` and `leave`, and no client payload is ever rebroadcast.
- Ignore malformed payloads without throwing.

## Done when
- [x] Two sockets with different tokens: `emitToUser` reaches only the right one
- [x] `join` with `user:<otherId>` is ignored
- [x] `viewers` goes 1 → 2 → 1 as a second socket joins and disconnects
- [x] `verify` passes
