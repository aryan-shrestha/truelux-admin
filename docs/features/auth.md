# Auth

Status: Planned

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

## Tests

To be written:

- The login action sets both cookies as httpOnly.
- A bad login shows the error without leaking which field was wrong.
- The client refreshes on 401 and retries once, and redirects when the refresh fails.
- The proxy redirects anonymous requests.
- The `next` parameter rejects `//evil.com` and absolute URLs.
- Playwright: log in, land on the dashboard, sign out.
