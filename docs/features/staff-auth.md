# Staff auth

Status: Implemented

Last updated: 2026-10-11

---

## Goal

Only TrueLux staff can use the admin. The SPA signs staff in against the API, keeps
the token pair in the browser, and renews it without interrupting their work
(ADR 0005, back-end ADR 0020).

---

## Scope

What is included in this implementation?

- `/login`: a shadcn `card` with a react-hook-form + Zod form (email, password) and
  one form-level alert for the API's refusal
- The token pair in `localStorage`, owned by `src/lib/repositories/session.ts`
- A bearer token on every API call, and one shared refresh per tab on a 401, then one
  retry, in the HTTP client's interceptors
- A route guard on `_dashboard`, and `/login` sending a signed-in user onwards
- A `next` parameter that accepts same-origin relative paths only
- `GET /api/v1/auth/me/` for the guard and the user menu ([app-shell.md](app-shell.md))
- Sign-out from the user menu

What is explicitly outside the scope?

- Password reset and MFA. Staff accounts are created by a superuser in
  `/django-admin/` or with the back-end's `make seed-staff`.
- Roles: the API has none; every staff user can do everything.

---

## Context

- Requirements ported from `../admin/docs/features/auth.md` and the session parts of
  `../admin/docs/features/tanstack-query.md`, with the server-side cookie session of
  `../admin` (and of this app's former BFF) replaced by browser storage, as back-end
  ADR 0020 now specifies.
- API: `back-end/docs/features/staff-auth.md`; summary in
  [../integrations/truelux-api.md](../integrations/truelux-api.md#authentication).
- Lifetimes come from the API: access 15 minutes, refresh 7 days. Refresh tokens
  rotate and the old one is blacklisted.
- The API lists the admin's origin in `DJANGO_CORS_ALLOWED_ORIGINS` and exposes
  `X-Request-ID` to it.

---

## Planned

None.

---

## Implemented

- `src/lib/repositories/session.ts` — `localStorage["truelux-admin-session"]` holds
  `{ access, refresh }`. `readSession` parses it with `TOKEN_PAIR_SCHEMA` and treats
  a corrupt value or blocked storage as no session; `hasSession`, `saveSession`,
  `clearSession`.
- `src/lib/repositories/client.ts`:
  - request interceptor: `Authorization: Bearer <access>` on every call except
    `auth/token/` and `auth/token/refresh/`
  - response interceptor, for a request that carried a token:
    - 401: if storage now holds a different access token (another tab refreshed),
      retry with it; otherwise share one in-flight `POST auth/token/refresh/` per
      tab, save the rotated pair and retry once
    - a refused refresh (any HTTP answer) ends the session, unless another tab
      stored a newer refresh token meanwhile, in which case the request retries
      with that
    - a retried request that gets 401 again, or any 403, ends the session
    - a refresh that cannot reach the API rejects the request with
      `network_error` and keeps the session
    - ending the session clears the tokens and does a full page load of
      `/login?expired=1&next=<path+search>`, which also drops the query cache
- `src/features/auth/`:
  - `repositories/auth.repository.ts` — `signIn` (`POST auth/token/`, then
    `saveSession`), `signOut` (`POST auth/logout/` with the refresh token, ignoring
    any failure, then `clearSession` always), `getMe`
  - `queries/auth.queries.ts` — `authKeys`, `authQueries.me()` (`reference`
    freshness)
  - `queries/auth.mutations.ts` — `useSignIn` (clears the cache on success),
    `useSignOut` (navigates to `/login`, then clears the cache)
  - `next-path.ts` — `safeNextPath`, ported from `../admin/lib/auth/next-path.ts`
  - `schemas/` — `STAFF_USER_SCHEMA`, `LOGIN_FORM_SCHEMA`
  - `components/login-form.tsx` — `noValidate`; Zod messages in `FieldError` with
    `aria-invalid`; `autoComplete="username"` / `"current-password"`; the API's
    refusal as one `aria-live="polite"` alert, never on a field; a spinner while
    pending; an "ended session" alert on `?expired=1`
  - `components/user-menu.tsx` — see [app-shell.md](app-shell.md)
- `src/routes/_dashboard.tsx` — `beforeLoad`: without a stored session, redirect to
  `/login` (with `next` unless the path is `/`); otherwise
  `ensureQueryData(authQueries.me())`.
- `src/routes/_auth/login.tsx` — `validateSearch` for `next` and `expired`;
  `beforeLoad` sends a signed-in visitor to `safeNextPath(next)` unless `expired`.

Error treatment:

| Answer                                                         | Treatment                                                |
| -------------------------------------------------------------- | -------------------------------------------------------- |
| `authentication_failed` on sign-in                             | "Email or password is incorrect."                        |
| anything else on sign-in (`throttled`, `network_error`, …)     | `describeError`                                          |
| 401 on any other call                                          | one shared refresh, then one retry                       |
| refused refresh; 401 after the retry; 403 `permission_denied`  | clear the tokens, full load of `/login?expired=1&next=…` |
| any failure of `auth/logout/` (`422 invalid_refresh_token`, …) | ignored; the tokens are cleared anyway                   |

---

## Remaining

- Playwright against the live API (`e2e/auth.spec.ts`) has not been run: it needs the
  API running with `http://localhost:5173` in `DJANGO_CORS_ALLOWED_ORIGINS`, and
  `E2E_STAFF_EMAIL` / `E2E_STAFF_PASSWORD`.

---

## Decisions

### Decision: refresh on a 401, once per tab

**Decision**

The response interceptor refreshes after a 401, not ahead of the access token's
expiry, and every request waiting in the tab shares one refresh.

**Reason**

Refresh tokens rotate and the old one is blacklisted: two refreshes with the same
token sign the second one out. Reacting to the API's 401 needs no clock or JWT
decoding in the browser.

**Consequence**

One failed request every 15 minutes, retried transparently.

### Decision: tabs share the session through storage

**Decision**

Before refreshing, and after a refused refresh, the client re-reads storage and uses
a pair another tab has just stored.

**Reason**

All tabs share one `localStorage`, so the cross-tab race that `../admin` could not
remove (two tabs refreshing the same token) mostly resolves itself.

**Consequence**

Two tabs that refresh in the same instant can still race; the loser sees a refused
refresh, finds the winner's token in storage and retries with it.

---

## Gotchas

- Wrong password, unknown email, inactive and non-staff accounts get the same
  `401 authentication_failed`, so the sign-in message is one sentence for all four.
- A user who loses staff rights keeps a valid access token for up to 15 minutes;
  the API answers it with `403 permission_denied`, not 401. Both end the session.
- A refresh token whose user was deleted gets `404 not_found`; a throttled refresh
  gets `429`. Any HTTP answer to a refresh other than 2xx is a refusal.
- An origin missing from the API's `DJANGO_CORS_ALLOWED_ORIGINS` makes sign-in fail
  as `network_error`, with nothing in the API's logs.
- Any script running on the admin origin can read both tokens (ADR 0005). Signing out
  revokes this browser's refresh token only; to cut off a stolen one, deactivate the
  user or remove `is_staff` in `/django-admin/`.

---

## API

```text
POST /api/v1/auth/token/           { email, password } → { access, refresh }
POST /api/v1/auth/token/refresh/   { refresh } → { access, refresh }
POST /api/v1/auth/logout/          { refresh } → 204   (bearer)
GET  /api/v1/auth/me/              → { id, email, first_name, last_name }   (bearer)
```

Bodies and errors: `back-end/docs/features/staff-auth.md`.

---

## Data changes

- `localStorage["truelux-admin-session"]` — `{ access, refresh }`.
- Query key `["auth", "me"]`.
- URL params on `/login`: `next`, `expired`.

---

## Permissions

- Signed-in staff only, enforced by the API. The route guard is navigation, not
  authorization.

---

## Tests

- `src/lib/repositories/session.test.ts` — round trip; a corrupt or incomplete value
  is no session; clearing.
- `src/lib/repositories/client.test.ts` — the bearer is sent, but not to
  `auth/token/`; three concurrent 401s cause one refresh, three retries and a stored
  rotated pair; a pair another tab stored is used without refreshing; a refused
  refresh clears the session and loads `/login?expired=1&next=…`; a 403 ends the
  session; an unreachable refresh keeps it; a refused sign-in neither refreshes nor
  redirects.
- `src/features/auth/next-path.test.ts` — the ported `safeNextPath` cases.
- `src/features/auth/components/login-form.test.tsx` — invalid input is blocked
  with Zod messages; a refusal shows the generic message without marking a field;
  success stores the tokens and opens `next`; `?expired=1` shows its alert.
- `src/features/auth/components/user-menu.test.tsx` — sign-out sends the refresh
  token, forgets the session and lands on `/login`, also after a `422`.
- `src/app/router.test.tsx` — an anonymous visit lands on `/login`; a signed-in
  visit to `/login?next=/` goes on to the dashboard.
- `e2e/shell.spec.ts` — a visit without a session lands on `/login`.
- `e2e/auth.spec.ts` — sign in, dashboard, sign out; a wrong password. Skipped
  unless `E2E_STAFF_EMAIL` and `E2E_STAFF_PASSWORD` are set.

---

## Files

```text
src/lib/repositories/session.ts
src/lib/repositories/client.ts
src/features/auth/
src/routes/_auth/login.tsx
src/routes/_dashboard.tsx
src/test/staff.ts
e2e/auth.spec.ts
```

---

## Future context

If the admin regains a server, or shares a registrable domain with the API, revisit
ADR 0005: an httpOnly refresh cookie would take the long-lived token out of
script's reach.
