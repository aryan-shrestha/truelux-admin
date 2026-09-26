# Architecture

Last updated: 2026-09-25

This document describes the current architecture of the admin.

It should describe durable architectural facts, not implementation history or a
tutorial for the entire codebase.

---

## System overview

A server-rendered Next.js App Router back office for the TrueLux cosmetics store. It
owns no data. Every product, stock figure, order and total lives in the Django API;
the admin's job is to render that data densely and to turn the merchant's intent
into API writes.

```text
  Staff browser ──── admin.truelux.com (Vercel) ─────────────────────────────┐
     │  httpOnly cookies: tl_access, tl_refresh                              │
     │                                                                       │
     ↓                                                                       │
  proxy.ts  ── no session? → /login?next=…                                   │
     │      ── access token missing or < 60 s left? → refresh, set cookies   │
     ↓                                                                       │
  Server Components (reads)        server actions (writes)                   │
     └──────────── lib/api (server-only), Authorization: Bearer ─────────────┘
                                   ↓
                         Django REST API /api/v1/auth/, /api/v1/admin/
                                   ↓
                         Supabase Postgres · Cloudinary
```

Three properties define this architecture:

- **The browser never talks to the API** ([ADR 0001](decisions/0001-auth-is-a-backend-for-frontend.md)).
  The staff JWTs sit in httpOnly cookies on the admin's origin; only the admin's
  server reads them. The API needs no CORS or CSRF configuration for the admin.
- **Every page is dynamic.** Each render reads the session cookie and fetches with
  `cache: "no-store"`. Data is private to a staff user and must be current; nothing
  is cached between requests.
- **Table state lives in the URL.** Filters, search, page and tab are search params,
  so a view is linkable, the back button works, and a mutation is followed by a
  server re-render rather than a client refetch.

---

## Application structure

```text
app/
    layout.tsx              fonts, theme, toaster, noindex metadata
    error.tsx               catches the admin layout
    not-found.tsx
    robots.ts
    login/page.tsx
    (admin)/
        layout.tsx          sidebar frame; GET auth/me/
        loading.tsx  error.tsx
        page.tsx            dashboard
        orders/  orders/[id]/
        products/  products/new/  products/[id]/
        brands/  categories/  shades/  sizes/
proxy.ts
components/
    ui/                     shadcn components
    shell/                  AppSidebar, UserMenu, PageHeader, LoadFailure
    data-table/             DataTable, UrlSearch, UrlSelect, TablePagination
    form/                   RHF-bound fields, RecordDialog, ConfirmAction
    auth/  dashboard/  orders/  products/  taxonomy/
lib/
    api/                    client, errors, types, one module per API area
    actions/attempt.ts      API failure → ActionResult
    auth/                   tokens, session, next-path, actions, login schema
    orders/  products/  taxonomy/  catalog/
    format/                 money, date
    search-params.ts
    env.ts
tests/
    fixtures/  e2e/
```

### `app/`

Routes and nothing else. A page reads `params`/`searchParams`, calls `lib/api` (in
parallel with `Promise.all` where the calls are independent), and composes
components. `(admin)` is a route group: it adds the sidebar frame without adding a
URL segment.

### `components/`

`components/ui/` holds shadcn components, including the admin's theming (badge
status variants, link-based pagination, the inset's `min-w-0`). Feature components
are grouped by area. Column definitions and dialogs are client components because
they hold functions and state; the pages that render them are server components.

### `lib/api/`

**The only module that calls the backend**, and it imports `server-only`. It owns
the base URL, the bearer header, the refresh logic, envelope parsing and the wire
types. Types mirror the API's snake_case field names exactly.

### `lib/<domain>/`

Per area: zod schemas shared by the form and the server action, URL ↔ API query
mapping, and the `"use server"` actions.

---

## Render flow

```text
Request
    ↓
proxy.ts: session present? access token fresh? (refresh here if not)
    ↓
(admin)/layout.tsx → GET auth/me/
    ↓
page.tsx → lib/api apiRead (no-store) → typed data, or ApiError
    ↓
RSC payload → HTML → hydration of the client islands
```

Mutations:

```text
Client component (form, dialog, row action)
    ↓ calls
Server action (lib/<domain>/actions.ts) — POST to the current route, so proxy.ts runs first
    ↓
zod re-validation → attempt(apiWrite(...)) → revalidatePath(...)
    ↓
ActionResult → toast, inline field errors, or redirect
```

Deviations:

- **`/login`** is the only route reachable without a refresh cookie.
- **`/login?expired=1`** is let through even with a refresh cookie, so an ended
  session does not loop between the login page and the page that sent it.

---

## Layer boundaries

### Routes (`app/**/page.tsx`, `layout.tsx`)

Responsibility: define a URL, its metadata and its boundaries; read params; call
`lib/api`; compose.

Restrictions: no `fetch`, no formatting, no rules about what data means. A route may
turn `not_found` into `notFound()`.

### Server Components

Responsibility: turn data into markup. The default.

Restrictions: no state, no effects, no handlers. **A value imported from a
`"use client"` module is a client reference on the server**, so constants and
helpers a server component needs live in `lib/`, not in a client component file.

### Client Components

Responsibility: forms, dialogs, row actions, URL-driven controls, the chart, the
sidebar.

Restrictions: never import `lib/api`; call server actions. Never read `process.env`.

### Server actions

Responsibility: every write. Validate arguments (they arrive from the network),
call `lib/api` inside `attempt()`, revalidate, return `ActionResult`.

Restrictions: no rendering decisions; the component decides how to show a failure.

### `lib/api`

Responsibility: the wire. One function per endpoint, named for what it returns;
`apiRead` for renders, `apiWrite` for actions.

Restrictions: no React, no formatting, no status codes returned.

---

## Data fetching and caching

Every call is `cache: "no-store"`. There is no data cache, no ISR and no
`revalidate` interval: the data is per-user and operational, and the staff throttle
(`2000/hour` per user) is generous for one merchant.

`revalidatePath` after a mutation refreshes the router so the current page
re-renders from the API. Independent reads on one page run in parallel.

---

## State

| Tier              | Holds                                                 | Lives for     |
| ----------------- | ----------------------------------------------------- | ------------- |
| URL search params | Filters, search, page, product tab                    | The link      |
| Cookies           | `tl_access`, `tl_refresh` (httpOnly); `sidebar_state` | The session   |
| React state       | Dialog open, form values, drafts, pending transitions | The page view |

`next-themes` keeps the colour theme in `localStorage`. There is no other browser
storage.

---

## Authentication and authorization

**Staff only, via SimpleJWT, held server-side.**

- `signIn` posts to `auth/token/` and writes both tokens as httpOnly,
  `SameSite=Lax`, `Path=/` cookies (`Secure` in production) whose `maxAge` follows
  each token's `exp` (15 minutes and 7 days).
- `proxy.ts` refreshes when the access cookie is missing or within 60 s of expiry,
  and forwards the new pair on the request so the render uses it. Refresh tokens
  rotate and are blacklisted, so only a context that can persist the new pair may
  refresh: the proxy, or a server action.
- `apiRead` treats 401 and 403 as an ended session (`/login?expired=1`). A
  de-staffed user's access token still authenticates until it expires and is
  answered 403.
- `apiWrite` refreshes once on a 401 and retries; a failed refresh clears the cookies
  and redirects to `/login`.
- `signOut` posts `auth/logout/` and clears the cookies whatever the result
  (`422 invalid_refresh_token` included).
- The `next` parameter passes through `safeNextPath`: same-origin paths only.

Authorization is the API's: every admin route is `IsAdminUser`. The admin has no
roles.

---

## Error handling

`lib/api` parses the envelope once and throws `ApiError` (`code`, `status`,
`details`, `requestId`). A request that never reached the API throws
`ApiUnreachableError`.

**Branch on `code`.** The backend pins codes and rewords messages.

| `code`                                                                        | Where           | Treatment                                                        |
| ----------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `authentication_failed`                                                       | login           | "Email or password is incorrect." — one message, no field marked |
| `authentication_failed`, `permission_denied`                                  | any read        | `/login?expired=1`                                               |
| `authentication_failed`                                                       | any write       | refresh once and retry; else clear cookies, `/login`             |
| `throttled`                                                                   | any             | "Too many requests. Wait a moment and try again."                |
| `validation_error`                                                            | forms           | `details` onto matching fields; the rest as a form alert         |
| `not_found`                                                                   | detail pages    | `notFound()`                                                     |
| `conflict`                                                                    | taxonomy delete | "In use by N products/variants…"                                 |
| `conflict`                                                                    | product delete  | "…has been ordered" with **Unpublish instead**                   |
| `conflict`                                                                    | variant delete  | "…has been ordered… Set its stock to 0 instead."                 |
| `conflict`                                                                    | any save        | "This duplicates an existing record…" (taken name, slug or SKU)  |
| `product_has_no_variants`                                                     | product form    | on the Published switch                                          |
| `invalid_status_transition`, `order_already_shipped`, `order_not_cancellable` | order actions   | toast with the code's sentence                                   |
| `invalid_refresh_token`                                                       | sign out        | ignored; cookies cleared                                         |
| anything else                                                                 | any             | "Something went wrong (ref <request id>)."                       |

The code → sentence map is `lib/api/errors.ts#describeError`.

A read failure during render reaches `app/(admin)/error.tsx` (inside the frame) or
`app/error.tsx` (the frame itself failed), which show the error digest and a
**Try again** that calls Next's `retry()`.

---

## External systems

| System          | Purpose                     | Integration point                                                                                                  | Important constraint                                                                                                           |
| --------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Django REST API | All data and auth           | `lib/api` over HTTPS; `API_BASE_URL`                                                                               | Server-only. Trailing slashes required. Refresh tokens rotate and blacklist. See [backend-api.md](integrations/backend-api.md) |
| Cloudinary      | Product images, brand logos | `next/image` (`remotePatterns`) and `avatar`; `lib/api/media.ts` resolves the local API's relative `/media/…` URLs | URLs are public; allowed in the CSP `img-src`                                                                                  |
| Vercel          | Hosting                     | Deploy target                                                                                                      | Function request bodies are capped at 4.5 MB                                                                                   |

---

## Deployment shape

Vercel with defaults; no `vercel.json`. All routes are dynamic. `lib/env.ts`
validates `API_BASE_URL` and `NEXT_PUBLIC_BRAND_NAME`, and `next.config.ts` imports
it so a missing variable fails the build. Security headers and a CSP are set in
`next.config.ts`. Steps are in the README.

---

## Accessibility and performance

- Server-render everything that can be; client islands are forms, dialogs and
  controls.
- Every interactive element is a shadcn button, link, input or menu item with a
  visible focus ring from the theme's `--ring`.
- Status is a word in a badge, never colour alone.
- Tables scroll inside their card on small screens; the page never scrolls sideways.

---

## Important constraints

- **Only `lib/api` calls the backend, and only on the server.**
- **Server Components never write cookies**; the proxy and server actions do.
- **Every mutation is a server action** that re-validates its input.
- **Money is a decimal string** outside `lib/format/money.ts`.
- **The admin never decides** a price, a total, stock or which transitions are
  allowed.
- **Every environment variable is read in `lib/env.ts`.**
- **No component library but shadcn/ui.**

---

## Known architectural limitations

- **Concurrent refreshes race.** Two requests with an expired access token (a click
  and a hover prefetch) both try to rotate the same refresh token; the API
  blacklists it after the first, so the second lands on `/login?expired=1`. The
  cookies from the winner survive and a reload recovers. A backend grace period for
  reused refresh tokens would remove this.
- **A throttled refresh looks like an expired session** until the `auth` throttle
  window passes.
- **Uploads pass through a Vercel function**, capped at 4.5 MB per request.
- **The CSP allows inline scripts** because Next's bootstrap has no nonce.
- **Taxonomy search refetches the whole array** on every search change; fine at
  catalogue sizes of hundreds, not thousands.
