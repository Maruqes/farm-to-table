---
id: CT-10
title: API contract — profile and mock card
status: done
depends_on: [FE-10]
source: [FE-10, SCOPE.md §0 §3]
consumers: [apps/web/src/features/auth/profile/profile.http.ts, apps/web/src/features/auth/profile/profile.dto.ts]
---
Follows CT-00 and CT-01. Frozen once a human sets `status: done`. All endpoints need a token (401 `UNAUTHORIZED` without one). The user is always the token's `sub`; there is no id in the path.

## Types
```ts
Card = {
  last4: string,            // 4 digits; the full number is never returned or stored
  holder: string,
  expiry: string,           // "MM/YY"
  simulateInvalid: boolean  // true = charging this card always fails (SCOPE.md §3)
}
Profile = {
  id: string,
  name: string,
  email: string,
  address: string,          // free text, "" when not set
  card: Card | null         // null until a card is saved; always null for producer/admin
}
```

## GET /api/users/me
- Role: buyer, producer.
- 200 → `Profile`

## PUT /api/users/me
- Role: buyer, producer.
- Request: `{ name: string, email: string, address: string }` (`name` and `email` non-empty, `email` valid; `address` may be `""`).
- 200 → `Profile` (updated)
- 400 `VALIDATION_ERROR` with `fields`, e.g. `{ "email": "Already registered" }` for an email owned by another user.

## PUT /api/users/me/card
- Role: buyer only (403 `FORBIDDEN` for others). Replaces any saved card.
- Request: `{ number: string, holder: string, expiry: string, simulateInvalid: boolean }`
  - `number`: 16 digits, spaces allowed (client sends them grouped, "4111 1111 1111 1111"); server strips spaces and checks 16 digits + Luhn.
  - `holder`: non-empty. `expiry`: `MM/YY`, month 01–12, not in the past.
- 200 → `Profile` with `card` set (`last4` from `number`).
- 400 `VALIDATION_ERROR` with `fields` keyed `number` | `holder` | `expiry`.

## Server rules this page relies on
- A failed Luhn check is rejected at save time; `simulateInvalid` is the only way to store a card that later fails at auction close.
- The session `name`/`email` held by the client is not refreshed by these endpoints; a new JWT/user is only issued at login.
- No realtime events.
