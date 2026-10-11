# ADR 0005: The admin is a static SPA that keeps the JWT in localStorage

Status: Accepted

Date: 2026-10-11

Supersedes: [ADR 0001](0001-the-admin-is-an-spa-behind-a-bff-that-holds-the-jwt.md)

---

## Context

ADR 0001 put a backend-for-frontend (BFF) next to the SPA, to hold the staff JWT
in httpOnly cookies and proxy every API call. It existed only to satisfy back-end
ADR 0012. That decision has been superseded by
[back-end ADR 0020](../../../back-end/docs/decisions/0020-the-admin-app-keeps-jwt-in-browser-storage.md):
the admin app is a client-only React app that calls the API from the browser and
keeps both tokens in `localStorage`. The API lists the admin's origin in
`DJANGO_CORS_ALLOWED_ORIGINS` and exposes `X-Request-ID` to it.

Keeping the BFF would mean a server runtime, a proxy allow-list and a cookie
session for a back office whose only data source already accepts header auth from
the browser.

---

## Decision

The admin is a static SPA with no server of its own.

- The browser calls `{VITE_API_URL}/api/v1/auth/*` and `/api/v1/admin/*` directly
  through the one Axios instance, `src/lib/repositories/client.ts`.
- The SimpleJWT access and refresh tokens are kept in `localStorage`, read and
  written only through `src/lib/repositories/session.ts`. Only the HTTP client and
  the auth repository (`signIn`, `signOut`) call it.
- A request interceptor sends `Authorization: Bearer <access>`. A response
  interceptor answers a 401 with one shared refresh per tab
  (`POST auth/token/refresh/`), saves the rotated pair and retries the request
  once. A refused refresh clears the tokens and sends the tab to sign-in.

---

## Reason

It is what the back-end now specifies, and it removes the BFF, its dev process, its
deployment question and its proxy rules. Header auth works on any pair of domains,
including preview URLs, without cookies or CSRF protection.

---

## Alternatives considered

### Keep the BFF (ADR 0001)

Why it was not chosen: it needs a server runtime the admin otherwise does not, and
the back-end no longer requires the tokens to stay server-side.

### Access token in memory, refresh token in localStorage

Why it was not chosen: the refresh token is the long-lived secret, so an XSS can
still read the token that matters; every reload would also cost a refresh.

---

## Consequences

### Positive

- The admin deploys as static files.
- One process in development (`yarn dev` is Vite only).
- Every tab shares one session through `localStorage`, so a tab can pick up a pair
  another tab has just rotated instead of signing out.

### Negative

- An XSS on the admin origin can read both tokens. A stolen refresh token that keeps
  being refreshed never expires; the risks are spelled out in back-end ADR 0020.
- Every environment's admin origin must be listed in the API's
  `DJANGO_CORS_ALLOWED_ORIGINS`. Without it, every call fails as `network_error` and
  nothing reaches the API's logs.

### Constraints introduced

- Only `client.ts` and `src/features/auth/repositories/` handle token values;
  everything else asks `hasSession()`. Tokens are never logged, rendered, put in a
  URL or a query key.
- `dangerouslySetInnerHTML` stays forbidden, and no third-party script is loaded at
  runtime: the tokens are only as safe as the origin is free of injected script.
- The token endpoints receive no `Authorization` header and never trigger a refresh.

---

## Implementation

```text
src/lib/env.ts
src/lib/repositories/session.ts
src/lib/repositories/client.ts
src/features/auth/
docs/features/staff-auth.md
```

---

## Future reconsideration

Revisit with back-end ADR 0020: if the admin regains a server runtime, or the admin
and the API come to share a registrable domain so an httpOnly refresh cookie
becomes practical.
