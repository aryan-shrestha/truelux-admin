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

Today the app is a shell: it starts, shows the sidebar and placeholder pages, and
reaches the API through the BFF. Staff cannot sign in yet (staff-auth, Planned).

---

## Running it locally

1. Start the API: `cd ../back-end && docker compose up -d && make run`
   (see its README). It listens on `http://localhost:8000`.
2. In this repository: `cp .env.example .env`, `yarn install`, `yarn dev`.
3. Open `http://localhost:5173`.

`yarn dev` runs two processes, labelled `web` (Vite) and `bff` (the Hono server on
8787). If either exits, both stop.

---

## Checking it is healthy

- `http://localhost:5173/bff/health` returns `{"status": "ok"}`: the BFF is up and
  Vite is proxying to it.
- `http://localhost:5173/bff/api/admin/dashboard/` returns the API's
  `401 authentication_failed` envelope: the BFF reaches the API. A
  `502 bad_gateway` means the API is not running or `API_URL` is wrong.

---

## When something goes wrong

- **The BFF does not start and names a variable**: it is missing or malformed in
  `.env`. Every variable in `.env.example` is required (ADR 0004).
- **Port 5173 or 8787 is in use**: both ports are fixed; stop the other process.
  Vite will not move to another port, because the BFF and Playwright expect 5173.
- **A screen shows "Something went wrong" with a reference**: the reference is the
  API's `X-Request-ID`. Search the API's logs for it.
- **Types complain about a route that exists**: run `yarn dev` or `yarn build` once
  to regenerate `src/routeTree.gen.ts`.

---

## Deploying

Not set up. See [features/scaffold.md](features/scaffold.md#remaining).
