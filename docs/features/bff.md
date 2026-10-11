# BFF

Status: In progress

Last updated: 2026-10-11

---

## Goal

Give the SPA a same-origin server that holds the staff JWT and forwards API calls
with it, so the browser never sees a token (ADR 0001, back-end ADR 0012).

---

## Scope

What is included in this implementation?

- `GET /bff/health`
- `/bff/api/*` → `API_URL/api/v1/*`, for an allow-list of prefixes, with the access
  token from the session cookie as a bearer token
- Zod-validated environment (ADR 0004)
- A Node entry point for development

What is explicitly outside the scope?

- Sign-in, refresh and sign-out (`/bff/auth/*`): the staff-auth feature
- The production host and its adapter
- Rate limiting: the API throttles the token endpoints (`auth` scope) and admin routes
  (`admin` scope) itself

---

## Context

Back-end ADR 0012 requires the admin's server to keep the SimpleJWT pair in httpOnly
cookies on its own origin and to send `Authorization: Bearer` on every call. The API
has no CORS entry for the admin and no cookie auth for staff. The API sets
`X-Request-ID` on every response.

---

## Planned

- `/bff/auth/login`, `/bff/auth/refresh`, `/bff/auth/logout` in staff-auth.
- Refresh on a 401 from the API, once, then forward the retried response.

---

## Implemented

- `server/app.ts` — `createApp({ apiUrl })`: `GET /bff/health` returns
  `{"status": "ok"}`; every method on `/bff/api/*` goes to the proxy.
- `server/proxy.ts` — `proxyToApi`:
  - resolves `api/v1/<rest>` against `API_URL` with `URL`, which normalises `..`
    and `%2e%2e`, then checks the result against `ALLOWED_API_PATHS`
    (`/api/v1/admin/`, `/api/v1/auth/me/`). Anything else is a 404 envelope and the
    API is not called.
  - forwards the query string, the method, and the body of any non-GET/HEAD request
    (buffered, so multipart uploads work against Django's WSGI server).
  - forwards only `accept`, `content-type` and `x-request-id` from the browser, so
    the browser's cookies never reach the API; adds `authorization` from the access
    cookie when present.
  - returns the API's status and body with only `content-type` and `x-request-id`;
    `set-cookie` and every other upstream header are dropped.
  - does not follow redirects (`redirect: "manual"`).
  - turns a failed connection into a 502 `bad_gateway` envelope.
- `server/session.ts` — `ACCESS_COOKIE` (`__Host-truelux_access`) and
  `readAccessToken`.
- `server/env.ts` — `readServerEnv`: `API_URL` must be an http(s) URL; every
  invalid variable is named in one error.
- `server/serve.ts` — Node server on port 8787 for `yarn dev`, loading `.env`.

---

## Remaining

- `/bff/auth/*` and writing the cookies: staff-auth.
- Refresh-on-401: staff-auth.
- A production entry point (Node with static `dist/`, or a serverless adapter):
  deployment.
- An upstream timeout: not added until the host's own limit is known.

---

## Decisions

### Decision: an allow-list, not a pass-through

**Decision**

The proxy forwards only `/api/v1/admin/` and `/api/v1/auth/me/`.

**Reason**

`/api/v1/auth/token/` and `/token/refresh/` return tokens in the response body. A
pass-through would hand them to the browser and defeat ADR 0001. Public storefront
routes have no use in the admin.

**Consequence**

A feature that needs another API area adds its prefix to `ALLOWED_API_PATHS`, with
a test.

### Decision: the URL is resolved before the allow-list check

**Decision**

The upstream URL is built with `new URL(...)` and its `pathname` is checked, not the
raw request path.

**Reason**

A raw-prefix check accepts `admin/../auth/token/`; URL resolution collapses it to
`/api/v1/auth/token/`, which the check then refuses.

**Consequence**

`server/proxy.test.ts` covers `..` and `%2e%2e`.

---

## Gotchas

- The `__Host-` prefix requires `Secure`. Chrome and Firefox treat
  `http://localhost` as secure and accept such cookies in development; Safari has
  not always done so. Verify in Safari when staff-auth lands, and record the result
  here.
- Vite's dev proxy sends `/bff/*` to port 8787; the port is fixed in both
  `vite.config.ts` and `server/serve.ts`.
- The SPA's paths are relative to `/bff/api/` and map to `/api/v1/`: the SPA writes
  `admin/orders/`, the API receives `/api/v1/admin/orders/`.

---

## API

### Endpoint

```text
GET /bff/health
ANY /bff/api/{admin/...|auth/me/}
```

### Request

As the API expects it, without credentials; the BFF adds the bearer token.

### Response

The API's response, with `content-type` and `x-request-id` only.

### Errors

```json
{ "error": { "code": "not_found", "message": "Not found.", "details": {} } }
```

```json
{ "error": { "code": "bad_gateway", "message": "The API could not be reached.", "details": {} } }
```

Every other error is the API's own envelope, passed through.

---

## Data changes

None.

---

## Permissions

The BFF authorizes nothing itself. Without an access cookie it forwards the call
anonymously and the API returns 401 `authentication_failed`.

---

## Tests

- `server/proxy.test.ts` — the bearer comes from the cookie and browser cookies are
  not forwarded; query string and JSON body are forwarded; `set-cookie` is dropped
  and `x-request-id` kept; token endpoints, `..`, `%2e%2e` and storefront paths get
  a 404 without calling the API; an unreachable API is a 502.
- `server/env.test.ts` — a valid `API_URL`; missing and non-http values are named.
- `e2e/shell.spec.ts` — `/bff/health` through the Vite proxy.

Checked by hand against the running API on 2026-10-11: `/bff/api/admin/dashboard/`
and `/bff/api/auth/me/` return the API's 401 envelope with an `X-Request-ID`;
`POST /bff/api/auth/token/` returns the BFF's 404.

---

## Files

```text
server/
├── app.ts
├── proxy.ts
├── session.ts
├── env.ts
├── serve.ts
├── proxy.test.ts
└── env.test.ts
```

---

## Future context

When staff-auth adds `/bff/auth/*`, set cookies with `httpOnly`, `secure`,
`sameSite: "Lax"`, `path: "/"` and no `domain` — the `__Host-` prefix rejects any
other combination silently.
