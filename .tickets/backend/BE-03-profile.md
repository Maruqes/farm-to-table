---
id: BE-03
title: Profile and mock card
status: done
depends_on: [BE-01]
contracts: [CT-10]
scope: §0 buyer profile, §3 winner payment (mock)
owns:
  - apps/api/src/modules/users/users.schemas.ts
  - apps/api/src/modules/users/users.service.ts
  - apps/api/src/modules/users/users.controller.ts
  - apps/api/src/modules/users/users.routes.ts
  - apps/api/src/modules/users/users.test.ts
verify: cd apps/api && npm run typecheck && npm test
---
## Build
`GET /api/users/me`, `PUT /api/users/me` (buyer, producer), `PUT /api/users/me/card` (buyer only), as CT-10.

## Server rules
- The user is always the token's `sub`. `PUT /users/me` accepts only `name`, `email`, `address`; `role`, `producer` and `card` in the body are ignored.
- Email change to one owned by another user → 400 `fields.email`.
- Card: strip spaces, require 16 digits and a passing Luhn check, `expiry` `MM/YY` not in the past. **Store only `last4`, `holder`, `expiry`, `simulateInvalid`.** The full number is never stored or logged.
- Export `chargeCard(userId): Promise<boolean>` from the service for BE-16: true only when a card exists, is not expired and `simulateInvalid` is false.
- `card` is always `null` for producers.

## Done when
- [x] All three endpoints match CT-10, including the field keys of 400 errors
- [x] Producer and admin calling `PUT /users/me/card` get 403; admin calling `GET /users/me` gets 403
- [x] The stored document holds no full card number (tested)
- [x] `verify` passes
