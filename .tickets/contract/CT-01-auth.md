---
id: CT-01
title: API contract — auth (login, register)
status: done
depends_on: [FE-01]
source: [FE-01, SCOPE.md §0 §6]
consumers: [apps/web/src/features/auth/auth-login-register/auth.http.ts]
---
Follows CT-00 (base path, JSON, error body, JWT). Frozen once a human sets `status: done`.

## Types
```ts
User = {
  id: string
  name: string
  email: string
  role: "buyer" | "producer" | "admin"
  producerStatus?: "pending" | "approved" | "rejected"  // only when role = "producer"
}
AuthResponse = { user: User, token: string }  // token: JWT per CT-00
```

## POST /api/auth/login
- Auth: none.
- Request: `{ email: string, password: string }`
- 200 → `AuthResponse`
- 400 `VALIDATION_ERROR` (missing/invalid fields, with `fields`)
- 401 `INVALID_CREDENTIALS` (unknown email or wrong password; same code for both)

## POST /api/auth/register
- Auth: none. Only `buyer` and `producer` may self-register.
- Request:
  ```ts
  {
    name: string
    email: string
    password: string            // min 8 chars
    role: "buyer" | "producer"
    farmName?: string           // required when role = "producer"
    locality?: string           // required when role = "producer"
  }
  ```
- 201 → `AuthResponse`. A new producer gets `producerStatus: "pending"`.
- 400 `VALIDATION_ERROR` with `fields`, e.g. `{ "email": "Already registered" }` for a duplicate email (400, not 409: it is a field error shown on the form).

## Client behaviour (for backend awareness)
- After success the client routes by `role` / `producerStatus`: buyer → `/`, approved producer → `/producer`, other producer → `/producer/status`, admin → `/admin`.
- No realtime events.
