# Running the admin app

Status: Current

Last updated: 2026-10-11

---

## Who this is for

You develop or operate TrueLux admin v2. The merchant's day-to-day runbook — orders,
stock, staff accounts — is the back-end's
[`handover.md`](../../back-end/docs/handover.md); it describes the work, whichever
admin app staff use for it. This file covers what is particular to running this
app.

Today staff can sign in, see the shell and the dashboard placeholder, and sign out.
The business screens are still to come ([features/index.md](features/index.md)).

---

## Running it locally

1. Start the API: `cd ../back-end && docker compose up -d && make run`
   (see its README). It listens on `http://localhost:8000`.
2. In the back-end's `.env`, add `http://localhost:5173` to
   `DJANGO_CORS_ALLOWED_ORIGINS` and restart it. Its `.env.example` lists only the
   storefront's ports.
3. For a staff login, run `make seed-staff` in the back-end (`DEMO_STAFF_EMAIL`,
   `DEMO_STAFF_PASSWORD`).
4. In this repository: `cp .env.example .env`, `yarn install`, `yarn dev`.
5. Open `http://localhost:5173` and sign in.

---

## Checking it is healthy

- `http://localhost:5173` redirects to `/login`.
- Signing in lands on the dashboard, and the user menu in the sidebar footer shows
  the staff email.

---

## When something goes wrong

- **The page is blank and the console names `VITE_API_URL`**: it is missing or
  malformed in `.env` (or on the host at build time). Every variable in
  `.env.example` is required (ADR 0004).
- **Sign-in says "The server could not be reached" and the API's logs show
  nothing**: the browser refused the call. Either the API is not running, or this
  origin is missing from the API's `DJANGO_CORS_ALLOWED_ORIGINS`; the browser's
  console names a CORS failure in the second case.
- **Port 5173 is in use**: the port is fixed; stop the other process. Vite will not
  move to another port, because Playwright and the CORS entry expect 5173.
- **A screen shows "Something went wrong" with a reference**: the reference is the
  API's `X-Request-ID`. Search the API's logs for it.
- **Staff are sent back to sign-in with "Your session has ended"**: their refresh
  token was refused (expired after 7 days, revoked, or the account lost staff
  rights). Signing in again starts a new session.
- **A staff member's token may have been stolen**: deactivate the user or remove
  `is_staff` in `/django-admin/`. A password change does not revoke tokens
  (back-end ADR 0020).
- **Types complain about a route that exists**: run `yarn dev` or `yarn build` once
  to regenerate `src/routeTree.gen.ts`.

---

## End-to-end tests

`yarn e2e` starts `yarn dev` and runs Playwright. The sign-in specs
(`e2e/auth.spec.ts`) run only with `E2E_STAFF_EMAIL` and `E2E_STAFF_PASSWORD` set
and the API running as above; otherwise they are skipped.

---

## Deploying

Not set up. See [features/deployment.md](features/deployment.md).
