---
id: CT-02
title: API contract — producer approval status (waiting / rejected)
status: review
depends_on: [FE-02]
source: [FE-02, SCOPE.md §0]
consumers: [apps/web/src/features/auth/producer-status/ProducerStatusView.tsx, apps/web/src/features/auth/producer-status/RequireApprovedProducer.tsx]
---
Follows CT-00 and CT-01. Frozen once a human sets `status: done`.

## Endpoints
None new. The page reads `user.producerStatus` (`"pending" | "approved" | "rejected"`) from the `AuthResponse` of `POST /api/auth/login` and `POST /api/auth/register`, as defined in CT-01.

## Server rules this page relies on
- `producerStatus` is present on every `User` with `role = "producer"` and absent for other roles.
- A new producer starts as `pending` (CT-01). Only an admin changes it, through the admin producer endpoints (FE-19, contract to come).
- Every producer-only endpoint answers **403 `PRODUCER_NOT_APPROVED`** when the caller's `producerStatus` is not `approved`. The client guard (`RequireApprovedProducer`) only hides UI; the server enforces it.

## Client behaviour (for backend awareness)
- The status is read once, at sign-in, and kept in the session. After an admin approves a producer, the producer must log out and back in to see the producer area (the page tells them so). No refresh endpoint and no realtime event.
- `approved` producers on `/producer/status` are redirected to `/producer`. A producer with no `producerStatus` sees an error state and a Log out button.

## Realtime
None.
