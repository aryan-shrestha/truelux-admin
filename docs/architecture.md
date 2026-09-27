# Architecture

Last updated: 2026-09-27

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
  Server Components      /api/* Route Handlers      server actions           │
  (first render)         (browser queries)          (writes)                 │
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
- **Every page is dynamic, and the browser owns the data after the first render.**
  A page prefetches into a per-request `QueryClient` and hands it over with
  `HydrationBoundary`. From then on TanStack Query refetches through the admin's own
  `/api/*` Route Handlers ([ADR 0005](decisions/0005-client-data-uses-tanstack-query.md)).
  The API is always read with `cache: "no-store"`; nothing is cached on the server.
- **Table state lives in the URL.** Filters, search, page and tab are search params,
  so a view is linkable and the back button works. They are written with the History
  API, so a change is a client query and not a server render. A mutation is followed
  by invalidating the queries it made stale.

---

## Application structure

```text
app/
    layout.tsx              fonts, theme, toaster, noindex metadata
    error.tsx               catches the admin layout
    not-found.tsx
    robots.ts
    login/page.tsx
    api/                    GET handlers for browser queries; POST session refresh
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
    shell/                  AppSidebar, UserMenu, PageHeader, LoadFailure, QueryProvider
    data-table/             DataTable, UrlSearch, UrlSelect, TablePagination
    form/                   RHF-bound fields, RecordDialog, ConfirmAction
    auth/  dashboard/  orders/  products/  taxonomy/
lib/
    api/                    client, errors, types, one module per API area
    actions/attempt.ts      API failure → ActionResult
    query/                  query defaults, server client, browser fetcher, action adapter
    auth/                   tokens, session, next-path, actions, login schema
    orders/  products/  taxonomy/  catalog/
    format/                 money, date
    search-params.ts
    env.ts
tests/
    fixtures/  e2e/
```

### `app/`

Routes and nothing else. A page reads `params`/`searchParams`, prefetches with
`lib/api` into `getServerQueryClient()` (in parallel where the calls are
independent), and renders a client view inside `HydrationBoundary`. `app/api/**`
holds one GET handler per read, so a browser query can reach `lib/api`. `(admin)` is a route group: it adds the sidebar frame without adding a
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
mapping, query keys and `queryOptions` (`queries.ts`, client-safe), and the
`"use server"` actions.

---

## Render flow

```text
Request
    ↓
proxy.ts: session present? access token fresh? (refresh here if not)
    ↓
(admin)/layout.tsx → GET auth/me/
    ↓
page.tsx → fetchQuery(lib/api apiRead, no-store) → dehydrate → HydrationBoundary
    ↓
RSC payload → HTML → hydration; the client view reads the same query key

Afterwards (focus, poll, invalidation, a filter change):
useSuspenseQuery → getJson("/api/…") → proxy.ts → Route Handler → lib/api apiGet
```

Mutations:

```text
Client component: useMutation (form, dialog, row action)
    ↓ calls
Server action (lib/<domain>/actions.ts) — POST to the current route, so proxy.ts runs first
    ↓
zod re-validation → attempt(apiWrite(...))
    ↓
ActionResult → throwOnFailure → onSuccess/onError (toast, field errors)
    ↓
meta.invalidates → the MutationCache invalidates and waits for the refetch
```

Deviations:

- **`/login`** is the only route reachable without a refresh cookie.
- **`/login?expired=1`** is let through even with a refresh cookie, so an ended
  session does not loop between the login page and the page that sent it.
- **`/api/*`** gets JSON, never a redirect, and is never refreshed in the proxy: no
  session → 401 `authentication_failed`; access token missing or expiring → 401
  `session_refresh_required`. `/api/session` is let through to refresh.

---

## Layer boundaries

### Routes (`app/**/page.tsx`, `layout.tsx`)

Responsibility: define a URL, its metadata and its boundaries; read params; call
`lib/api`; compose.

Restrictions: no `fetch`, no formatting, no rules about what data means. A route may
turn `not_found` into `notFound()`.

### Route Handlers (`app/api/**`)

Responsibility: one `lib/api` read each (GET), or the session refresh (POST).

Restrictions: `respond()` with `apiGet`; parse query strings with the same
`parse*Filters` as the page; validate path params.

### Server Components

Responsibility: turn data into markup. The default.

Restrictions: no state, no effects, no handlers. **A value imported from a
`"use client"` module is a client reference on the server**, so constants and
helpers a server component needs live in `lib/`, not in a client component file.

### Client Components

Responsibility: views that read queries, forms, dialogs, row actions, URL-driven
controls, the chart, the sidebar.

Restrictions: never import `lib/api`; read through `lib/<domain>/queries.ts`, write
through server actions in `useMutation`. Never read `process.env`.

### Server actions

Responsibility: every write. Validate arguments (they arrive from the network),
call `lib/api` inside `attempt()`, return `ActionResult`. No `revalidatePath`.

Restrictions: no rendering decisions; the component decides how to show a failure.

### `lib/api`

Responsibility: the wire. One function per endpoint, named for what it returns;
`apiRead` for renders, `apiGet` for Route Handlers, `apiWrite` for actions.

Restrictions: no React, no formatting, no status codes returned.

---

## Data fetching and caching

Every API call is `cache: "no-store"`. There is no server data cache, no ISR and no
`revalidate` interval: the data is per-user and operational. Route Handlers answer
`private, no-store`.

The browser cache is TanStack Query's, in memory and per tab:

- `staleTime` 30 s (taxonomy 5 min); refetch on window focus once stale.
- The dashboard and the orders list poll every 60 s while visible, about 60
  requests an hour per open tab against the staff throttle of `2000/hour`.
- Retry once only for an unreachable API or a 5xx; an API code is final.
- A mutation names the keys it makes stale (`meta.invalidates`).
- Optimistic updates only for values the API does not derive (image order, alt text,
  the list's publish toggle), rolled back on failure.

Keys and `queryOptions` live in `lib/<domain>/queries.ts`; see
[features/tanstack-query.md](features/tanstack-query.md).

---

## State

| Tier              | Holds                                                 | Lives for     |
| ----------------- | ----------------------------------------------------- | ------------- |
| URL search params | Filters, search, page, product tab                    | The link      |
| Query cache       | Server data, by key                                   | The tab       |
| Cookies           | `tl_access`, `tl_refresh` (httpOnly); `sidebar_state` | The session   |
| React state       | Dialog open, form values, drafts                      | The page view |

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
  answered 403. In the browser, `getJson` does the same with a full page load.
- Browser queries refresh once per tab: on `session_refresh_required`, `getJson`
  shares one `POST /api/session` across every waiting query, then retries. The
  handler checks `Origin`, and a refused refresh leaves the cookies alone.
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
`ApiUnreachableError`. Route Handlers pass an `ApiError` on in the same envelope
(`respond()`), so the browser rebuilds it with `toApiError`.

**Branch on `code`.** The backend pins codes and rewords messages.

| `code`                                                                        | Where           | Treatment                                                        |
| ----------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `authentication_failed`                                                       | login           | "Email or password is incorrect." — one message, no field marked |
| `authentication_failed`, `permission_denied`                                  | any read        | `/login?expired=1`                                               |
| `session_refresh_required` (admin-local, from `proxy.ts`)                     | browser query   | one shared `POST /api/session`, then retry                       |
| `api_unreachable` (admin-local, 502 from a Route Handler)                     | browser query   | one retry; then the error boundary or a background toast         |
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
**Try again** that resets failed queries and calls Next's `retry()`. A failed
background refetch keeps the data on screen and shows one toast per query.

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

- **Only `lib/api` calls the backend, and only on the server.** The browser calls
  `/api/*` on the admin's origin.
- **Server Components never write cookies**; the proxy and server actions do.
- **Every mutation is a server action** that re-validates its input, called through
  `useMutation`.
- **Money is a decimal string** outside `lib/format/money.ts`.
- **The admin never decides** a price, a total, stock or which transitions are
  allowed.
- **Every environment variable is read in `lib/env.ts`.**
- **No component library but shadcn/ui.**

---

## Known architectural limitations

- **Concurrent refreshes race.** Two page requests with an expired access token (a
  click and a hover prefetch), or two tabs, both try to rotate the same refresh
  token; the API blacklists it after the first, so the second lands on
  `/login?expired=1`. The cookies from the winner survive and a reload recovers.
  Browser queries within one tab do not race (one shared refresh). A backend grace
  period for reused refresh tokens would remove the rest.
- **A throttled refresh looks like an expired session** until the `auth` throttle
  window passes.
- **Uploads pass through a Vercel function**, capped at 4.5 MB per request.
- **The CSP allows inline scripts** because Next's bootstrap has no nonce.
- **Taxonomy lists load whole.** Search filters the cached array in the browser;
  fine at catalogue sizes of hundreds, not thousands.
