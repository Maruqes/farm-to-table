---
id: CT-00
title: API contract — cross-cutting conventions and realtime events
status: done
depends_on: [FE-00]
source: [FE-00, SCOPE.md §1 §3 §4 §6]
consumers: [apps/web/src/services/api.ts, apps/web/src/services/realtime.ts]
---
Frozen once a human sets `status: done`. After that, change it only through a new contract ticket.

## HTTP
- Base path `/api`, same origin (nginx/Vite proxy). JSON in and out, `Content-Type: application/json; charset=utf-8`.
- Field names and enum values are English, following SCOPE.md (`name`, `status`, `pending`…). Ids are strings, exposed as `id` (never `_id`).
- Dates: ISO 8601 UTC strings. Money: numbers in euros with 2 decimals (`12.5` = €12.50).
- Auth: `Authorization: Bearer <jwt>`, JWT expires in 2h. Payload `{ sub: userId, role: "buyer"|"producer"|"admin" }`.
- Status codes: 200 read/update, 201 create (+ `Location`), 204 delete, 400 invalid data, 401 no/expired token, 403 wrong role or not owner, 404 not found, 409 conflict (e.g. outbid, stock), 500 unexpected.
- Error body, every non-2xx:
  ```json
  { "error": { "code": "VALIDATION_ERROR", "message": "Human-readable English text", "fields": { "email": "Already registered" } } }
  ```
  `code` is a stable UPPER_SNAKE string; `fields` only on 400.
- Lists: plain arrays unless a module contract says it paginates.

## Realtime (Socket.io, path `/socket.io`)
- Handshake: `auth: { token: <jwt> }`. No token = visitor, may only join `auction:<id>` read-only.
- Rooms: `user:<id>` (joined automatically by the server for the token's user), `auction:<id>` (client emits `join` / `leave` with `{ room }`).
- Server → client events (payloads are the contract the mock in `realtime.ts` must emit):
  - `order-updated` → `user:<buyerId>` and `user:<producerId>`: `{ orderId: string, status: "pending"|"confirmed"|"ready"|"delivered"|"cancelled", updatedAt: string }`
  - `auction-updated` → `auction:<id>`: `{ auctionId: string, currentPrice: number, bidCount: number, leader: { id: string, name: string } | null, endsAt: string, status: "scheduled"|"active"|"ended" }`
  - `notification` → `user:<id>`: full `Notification` object (CT-09), emitted when the notification is stored.
- Module contracts add their own events here by new contract tickets, never ad hoc.

## Gaps found against current frontend (fixed 2026-11-11)
- `services/api.ts` now sends the Bearer token and normalises the error body into one `ApiError { status, code, message, fields? }`.
- The mock `realtime.ts` now emits `updatedAt` on `order-updated` and `leader`, `endsAt`, `status` on `auction-updated`.
- The real `SocketRealtimeClient` is implemented with `socket.io-client` (JWT handshake, `join`/`leave`, rejoin after reconnect).

## Done when
- [ ] Reviewed against SCOPE.md and approved by a human (`status: done`)
- [ ] Backend tickets reference this file for errors, auth and socket events
