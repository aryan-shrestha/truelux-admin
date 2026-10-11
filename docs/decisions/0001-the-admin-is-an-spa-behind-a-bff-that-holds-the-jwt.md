# ADR 0001: The admin is an SPA behind a BFF that holds the JWT

Status: Superseded by [ADR 0005](0005-the-admin-is-a-static-spa-that-keeps-jwt-in-local-storage.md)

Date: 2026-10-11

Supersedes: None

---

## Context

Admin v2 is a client-rendered React app built with Vite. It has no server of its
own, but back-end
[ADR 0012](../../../back-end/docs/decisions/0012-the-admin-app-authenticates-with-jwt-held-server-side.md)
requires the admin app's **server** to hold the staff JWT in httpOnly cookies and
send `Authorization: Bearer` itself, so that the browser never sees a token and the
API needs no CORS entry or cookie auth.

The API and the admin are on different sites until custom domains exist
(`*.onrender.com`, `*.vercel.app`), so cookies set by the API cannot be relied on.

---

## Decision

The admin ships with a small backend-for-frontend (BFF) in `server/`, a Hono app
served on the same origin as the SPA:

- `/bff/auth/*` signs staff in, refreshes and signs out by calling the API's token
  endpoints, and keeps the access and refresh tokens in `__Host-` httpOnly, Secure,
  `SameSite=Lax` cookies.
- `/bff/api/*` forwards to `API_URL/api/v1/*` with `Authorization: Bearer <access>`
  read from the cookie. It forwards only an allow-list of prefixes
  (`/api/v1/admin/`, `/api/v1/auth/me/`); token endpoints are never reachable
  through it.
- The SPA calls only `/bff/*`, with no credentials of its own.

This is the arrangement back-end ADR 0012 describes, with the BFF as "the admin
app's server". It refines that decision; it does not supersede it.

---

## Reason

It keeps every property back-end ADR 0012 was chosen for: no token readable by
script, no CORS or CSRF surface on the API, and it works on any pair of domains,
including preview URLs. No back-end change is needed.

Hono runs on Node, edge runtimes and serverless functions, so the BFF is not tied to
a hosting choice that has not been made yet.

---

## Alternatives considered

### The API sets the refresh token as an httpOnly cookie; the SPA keeps the access token in memory

Why it was not chosen: it needs back-end changes (cookie issue and rotation, CORS
for the admin origin, CSRF on the refresh endpoint), supersedes back-end ADR 0012,
and depends on cross-site cookies, which browsers increasingly block until a shared
custom domain exists.

### Both tokens in memory in the SPA

Why it was not chosen: a reload signs staff out, and the API would need a CORS entry
for the admin origin. A token held in JavaScript is also readable by any XSS.

### Tokens in `localStorage`

Why it was not chosen: readable by any XSS; back-end ADR 0012 already rejects it.

---

## Consequences

### Positive

- No credential ever reaches browser JavaScript.
- The API stays stateless and unaware of the admin's origin.
- The SPA's HTTP layer is trivial: same-origin requests, cookies sent by the
  browser.

### Negative

- The admin is no longer purely static hosting; it needs somewhere to run the BFF.
- Every API call takes an extra hop through the BFF.

### Constraints introduced

- The SPA never calls the API's origin directly.
- A new API area is opened to the SPA only by adding its prefix to
  `ALLOWED_API_PATHS` in `server/proxy.ts`.
- Token endpoints are called only by the BFF's own `/bff/auth/*` handlers.

---

## Implementation

```text
server/app.ts
server/proxy.ts
server/session.ts
src/lib/repositories/client.ts
vite.config.ts            dev proxy /bff → localhost:8787
docs/features/bff.md
```

---

## Future reconsideration

Revisit if the admin and the API come to share a registrable domain and the back-end
moves to cookie auth for staff, at which point the proxy could be removed.
