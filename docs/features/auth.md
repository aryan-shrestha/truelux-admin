# Auth

Status: Implemented

Last updated: 2026-09-25

---

## Goal

Only TrueLux staff can reach the admin. Tokens never reach the browser.

---

## Scope

What is included in this implementation?

- `/login`: shadcn `card` + `form` (react-hook-form + zod), email and password, and an
  inline error for `authentication_failed` or `throttled`
- A server action calls `POST /api/v1/auth/token/` and stores `access` and `refresh`
  in **httpOnly, Secure (in production), SameSite=Lax, Path=/** cookies. The access
  cookie's max-age follows the token's `exp`; the refresh cookie's follows its
  own `exp`.
- `proxy.ts` (Next 16's replacement for `middleware.ts`; check
  `node_modules/next/dist/docs/`) redirects any request without a refresh cookie to
  `/login?next=…`, and redirects `/login` to `/` when a refresh cookie exists
- `lib/api/client.ts` (`server-only`): attaches `Authorization: Bearer`. On a 401 it
  refreshes once through `/auth/token/refresh/`, rewrites both cookies, and retries.
  If the refresh fails, it clears the cookies and redirects to `/login`.
- Sign out: `POST /api/v1/auth/logout/`, then clear the cookies and redirect to
  `/login`
- `GET /api/v1/auth/me/` feeds the user menu
- The `next` parameter only accepts same-origin relative paths (open-redirect guard)

What is explicitly outside the scope?

- Password reset and MFA. Staff users are created by a superuser in `/django-admin/`
  or with `make seed-staff`.

---

## Context

Backend `docs/features/staff-auth.md`. [ADR 0001](../decisions/0001-auth-is-a-backend-for-frontend.md).

---

## Implemented

- `app/login/page.tsx` — `card` with the wordmark and `LoginForm`; shows an `alert`
  when arriving with `?expired=1`.
- `components/auth/LoginForm.tsx` — react-hook-form + `zodResolver(loginSchema)` over
  shadcn `Field`/`Input`; the server's failure is one form-level `alert`
  (`aria-live="polite"`), never attached to a field.
- `lib/auth/login-schema.ts` — the zod schema shared by the form and the action.
- `lib/auth/actions.ts` — `signIn` (validates, calls `POST /auth/token/`, writes both
  cookies, redirects to the guarded `next`) and `signOut` (`POST /auth/logout/`, then
  clears the cookies whatever the API said, then redirects to `/login`).
- `lib/auth/tokens.ts` — cookie names (`tl_access`, `tl_refresh`), the unverified
  `exp` read, and the cookie options: `httpOnly`, `secure` in production,
  `SameSite=Lax`, `Path=/`, `maxAge` = seconds until that token's `exp`.
- `lib/auth/session.ts` (`server-only`) — read, write and clear the pair through
  `next/headers`.
- `lib/auth/next-path.ts` — `safeNextPath`: only a same-origin path survives; `//x`,
  `/\x`, absolute and scheme URLs, control characters and `/login` fall back to `/`.
- `proxy.ts` — no refresh cookie: redirect to `/login?next=…`. Refresh cookie on
  `/login`: redirect to `next` (or `/`), except with `?expired=1`. Access cookie
  missing or within 60 s of expiry: refresh through the API, set the new pair on the
  response **and** on the forwarded request, or redirect to `/login?expired=1&next=…`
  if the refresh is refused.
- `lib/api/client.ts` (`server-only`) — `apiRead` for Server Components, `apiWrite` for
  server actions. `apiWrite` refreshes once on a 401, rewrites both cookies and retries;
  if the refresh fails it clears the cookies and redirects to `/login`. `apiRead`
  never refreshes (see Decisions); it sends a 401 or a 403 to `/login?expired=1`.
- `lib/api/auth.ts` — `obtainTokens`, `logout`, `getMe`.

---

## Remaining

- Not yet exercised against the live API. The backend's staff-auth is implemented;
  the calls here are verified against its documented behaviour with a stubbed
  `fetch` only.

---

## Decisions

### Decision: the proxy refreshes before a render; reads never refresh

**Decision**

`proxy.ts` renews the access token when it is missing or within 60 s of `exp`.
`apiRead` treats a 401 as a dead session and redirects to `/login?expired=1`.
`apiWrite` keeps the refresh-and-retry the feature asked for.

**Reason**

Next forbids setting cookies while a Server Component renders. The API rotates and
blacklists refresh tokens, so a render that refreshed without persisting the new pair
would burn the only valid refresh token and sign the user out on the next request.
The proxy runs before every page render and every server action POST, and can set
cookies on both the request and the response.

**Consequence**

The client's retry path runs in server actions, where cookies are writable. A 401 on
a read after the proxy has just refreshed means the account was deactivated or the
signing key changed.

### Decision: an expired session keeps its cookies until the next sign-in

**Decision**

`/login?expired=1` is let through even with a refresh cookie present, and nothing
clears cookies on a GET.

**Reason**

Without the flag, the proxy would bounce `/login` back to the page that sent it there
and loop. Clearing on GET would let any link sign a user out.

**Consequence**

The dead cookies are overwritten by the next successful sign-in, or cleared by the
next server action.

---

## Gotchas

- Parallel requests with an expired access token (a click plus a hover prefetch) can
  each try to refresh with the same token. The API blacklists it after the first
  rotation, so the loser is sent to `/login?expired=1`. The winner's cookies are not
  deleted, so a reload recovers the session.
- `lib/auth/tokens.ts` decodes the JWT payload without verifying it. The expiry only
  sizes the cookie; the API verifies every token.
- A `redirect()` inside a server action is an exception. `attempt()` rethrows it with
  `unstable_rethrow`; any other `try/catch` around an API call must do the same.
- A user who loses staff rights keeps a valid access token for up to its 15-minute
  lifetime; the API answers it with `403 permission_denied`, not 401. `apiRead` treats
  both as an ended session. The next refresh is refused with 401 by the API's
  `USER_AUTHENTICATION_RULE`.
- A refresh token whose user was deleted is answered `404 not_found`. The proxy and
  `apiWrite` treat any non-2xx refresh as refused, so it ends the session the same way.
- A throttled refresh (`429`, `auth` scope) is also treated as refused. The cookies
  are kept, so the session resumes once the throttle window passes.
- Logout with a revoked or foreign refresh token returns `422 invalid_refresh_token`.
  `signOut` clears the cookies whatever the call returned.
- Lifetimes come from the API (access 15 minutes, refresh 7 days); the cookies follow
  each token's `exp`, so nothing here hard-codes them.
- The login message for a wrong password, unknown email and non-staff account is the
  same sentence, because the API returns the same body for all four.

---

## Routes

```text
/login    dynamic; the only route reachable without a refresh cookie
```

---

## API

### Calls

```text
POST /api/v1/auth/token/           server action (signIn), no-store
POST /api/v1/auth/token/refresh/   proxy.ts, and apiWrite on a 401
POST /api/v1/auth/logout/          server action (signOut)
GET  /api/v1/auth/me/              server (admin layout)
```

### Errors handled

| `code` | Treatment |
| --- | --- |
| `authentication_failed` (login) | "Email or password is incorrect." |
| `throttled` (login) | "Too many requests. Wait a moment and try again." |
| `authentication_failed` (refresh) | proxy: `/login?expired=1`; `apiWrite`: clear cookies, `/login` |
| `authentication_failed` / `permission_denied` (any read) | `/login?expired=1` |
| `invalid_refresh_token` (logout) | ignored; the cookies are cleared anyway |

---

## State and data

- `tl_access`, `tl_refresh` cookies: httpOnly, `SameSite=Lax`, `Path=/`, `Secure` in
  production, `maxAge` from each token's `exp`.
- The login form's field values: react-hook-form state.

---

## Accessibility

- The form is `noValidate`; zod messages render in `FieldError` (`role="alert"`) and
  the invalid input gets `aria-invalid`.
- `autoComplete="username"` / `"current-password"` so password managers fill it.

---

## Tests

- `lib/auth/actions.test.ts` — sign-in sets both cookies httpOnly with each token's
  lifetime; an off-site `next` lands on `/`; a rejected login returns one generic
  message with no field errors and sets no cookie; throttling has its own message;
  sign-out blacklists and clears, and still clears on a `422 invalid_refresh_token`
  or when the API is unreachable.
- `lib/api/client.test.ts` — a write refreshes once on 401, rewrites both cookies and
  retries; a second 401 is not refreshed again; a failed refresh clears the cookies
  and redirects to `/login`; a read never refreshes; a 403 on a read ends the session.
- `proxy.test.ts` — anonymous requests go to `/login?next=`; signed-in visitors leave
  `/login`; `?expired=1` does not loop; an expiring token is renewed on the request
  and the response; a refused refresh goes to `/login?expired=1`.
- `lib/auth/next-path.test.ts` — `//evil.com`, `/\evil.com`, absolute URLs,
  `/..//evil.com`, control characters and `/login` all fall back to `/`.
- `components/auth/LoginForm.test.tsx` — client validation blocks the call; a
  rejected login shows the form-level message and marks no field invalid.
- `tests/e2e/auth-orders.spec.ts` — Playwright: sign in, land on the dashboard, open
  orders, sign out (needs `E2E_API`).

---

## Files

```text
proxy.ts
app/login/page.tsx
components/auth/LoginForm.tsx
lib/auth/
lib/api/client.ts
lib/api/auth.ts
```
