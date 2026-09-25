# ADR 0001: Auth is a backend-for-frontend

Status: Accepted

Date: 2026-09-25

Supersedes: None

---

## Context

The admin runs on a different origin from the API, and may run on `*.vercel.app`
before custom domains exist. Staff tokens are high-value.

---

## Decision

Only the admin's Next.js server talks to the API. It holds the staff JWTs in httpOnly
cookies on its own origin and calls the API with `Authorization: Bearer` from server
components and server actions. No client component fetches the API. The API client
module imports `server-only`.

---

## Reason

It keeps the JWTs away from browser JavaScript, needs no CORS or CSRF on the API,
and works on any domains. It mirrors the backend's ADR 0012.

---

## Consequences

### Constraints introduced

- Mutations are server actions. Interactive tables re-render through URL search
  params, not client fetches.
- `lib/api/*` must never be imported by a `"use client"` module.

---

## Implementation

```text
lib/api/client.ts
lib/auth/
proxy.ts
app/login/
```
