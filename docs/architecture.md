# Architecture

Last updated: 2026-10-11

This document describes the current architecture of the system.

It should describe durable architectural facts, not implementation history or a
tutorial for the entire codebase.

---

## System overview

TrueLux admin v2: the staff back office for a multi-brand cosmetics store. A React
single-page app and a small backend-for-frontend (BFF) served on one origin. The BFF
holds the staff JWT and forwards calls to the TrueLux Django API
(`../back-end`), which owns every piece of data (ADR 0001).

```text
Browser (React SPA)
  │  same origin, cookies only, never a token
  ↓
BFF (Hono, server/)
  ├── /bff/health
  ├── /bff/auth/*        sign-in, refresh, sign-out        (staff-auth, Planned)
  └── /bff/api/*         allow-listed proxy, adds Authorization: Bearer
  ↓
TrueLux API (Django REST Framework)
  └── /api/v1/admin/*, /api/v1/auth/*
```

Three properties define this architecture:

- **The browser never holds a credential.** The BFF keeps the access and refresh
  tokens in `__Host-` httpOnly cookies on the admin origin. This is exactly the
  arrangement back-end ADR 0012 requires of "the admin app's server", so the API
  needs no CORS entry and no cookie auth.
- **The admin owns no data.** Prices, stock, totals, order state and allowed
  transitions come from the API. The admin renders them and never computes a
  substitute.
- **Server state lives in TanStack Query.** The URL holds list state, Zustand holds
  UI preferences, React Hook Form holds form drafts, and nothing else stores data
  (ADR 0002).

---

## Application structure

```text
server/
    app.ts            createApp(): the Hono routes
    proxy.ts          /bff/api/* → API_URL/api/v1/*, allow-listed
    session.ts        cookie names and reads
    env.ts            Zod-validated environment (ADR 0004)
    serve.ts          Node entry point for development
src/
    main.tsx          applies the theme, creates the query client and router, renders
    app/              providers, router, query client: wiring only
    routes/           file routes; routeTree.gen.ts is generated from them
    features/         one folder per domain (ADR 0003)
    components/
        ui/           shadcn, generated
        layout/       app sidebar, top bar, page header, theme toggle
        data-table/   DataTable for server-paginated lists
        feedback/     route error and not-found pages
    lib/
        repositories/ client.ts (the Axios instance), errors.ts, pagination.ts
        theme.ts      applies the theme preference to <html>
        cn.ts         class-name helper used by shadcn
    stores/           ui.store.ts
    config/           navigation.ts
    styles/           globals.css: Tailwind v4 and the shadcn theme tokens
    test/             Vitest setup and the MSW server
e2e/                  Playwright specs
docs/
```

### `server/`

The BFF. It owns the staff session and the only route from the browser to the API.
It contains no business logic and no data: it authenticates, forwards, and returns
the API's response unchanged apart from headers. See
[features/bff.md](features/bff.md).

### `src/features/<domain>`

A vertical slice per domain the merchant works in (products, orders, …), named after
the back-end resource it consumes. A feature owns its repositories, queries,
schemas, components and hooks, and exposes a public surface in `index.ts`. Features
import each other only through that file.

### Shared code

`src/components`, `src/lib`, `src/stores`, `src/hooks` and `src/config` hold
infrastructure with no business meaning. They never import a feature or a route. A
component that knows what a product is belongs to the products feature even if two
pages show it.

---

## Request flow

```text
Route loader / component
    ↓
Query (queryOptions from the feature's key factory)
    ↓
Repository (path, params, Zod parse)
    ↓
httpClient (Axios, baseURL /bff/api/)
    ↓
BFF proxy (allow-list, cookie → bearer)
    ↓
TrueLux API
    ↓
ApiError on failure / parsed data on success
    ↓
TanStack Query cache → component
```

Deviations from this flow:

- **Sign-in, refresh and sign-out** go to `/bff/auth/*`, which the BFF answers
  itself after calling the API's token endpoints. These never pass through the
  proxy (staff-auth, Planned).
- **`/bff/health`** is answered by the BFF without calling the API.

---

## Layer boundaries

### Routes

Responsibility: declare the URL, validate search params with Zod, prefetch with
`queryClient.ensureQueryData`, and compose the page from feature components.

Restrictions: no HTTP, no business rules, no data transformation.

### Components

Responsibility: render data and collect input.

Restrictions: read server data only through a feature's queries. Never call a
repository or the HTTP client.

### Queries

Responsibility: query keys, `queryOptions`, mutations, invalidation and optimistic
updates.

Restrictions: call repositories, never the HTTP client.

### Repositories

Responsibility: one function per API operation. Build the path and parameters, send
the request through `httpClient`, parse the response with the feature's Zod schema.

Restrictions: no React, no cache access, no UI concerns. Never return unparsed
data.

### Schemas

Responsibility: Zod schemas for API responses, request bodies and form input. Types
are derived with `z.infer`.

Restrictions: describe shape and field rules only. A rule the API enforces is not
duplicated here beyond what the form needs for immediate feedback.

### Stores

Responsibility: UI state that is neither server data nor URL state: the sidebar and
the theme.

Restrictions: never a copy of server data, never anything sensitive (stores are
persisted to `localStorage`).

`eslint.config.js` enforces the import direction (ADR 0003).

---

## Authentication and authorization

**Authentication.** Staff sign in with email and password through the BFF, which
calls `POST /api/v1/auth/token/` and stores the pair in `__Host-` httpOnly, Secure,
`SameSite=Lax` cookies (staff-auth, Planned). On every proxied call the BFF reads
the access cookie and sends `Authorization: Bearer <access>`. Today only that read
is implemented, so every proxied call is anonymous and the API answers 401.

**The proxy refuses token endpoints.** It forwards only `/api/v1/admin/*` and
`/api/v1/auth/me/`. The path is resolved before the check, so `..` and `%2e%2e`
cannot reach `auth/token/`. A token response must never travel to the browser.

**Authorization** belongs to the API: every `/api/v1/admin/` route requires an
active staff user, and there are no finer roles (back-end `staff-auth.md`). The
admin does not hide or show features by role.

---

## State ownership

| State                                | Owner                                  |
| ------------------------------------ | -------------------------------------- |
| Anything the API returns             | TanStack Query cache                   |
| Page, page size, sort, filters, tabs | URL search params, validated with Zod  |
| Form drafts and validation           | React Hook Form + Zod                  |
| Sidebar open, theme preference       | Zustand (`ui.store.ts`), persisted     |
| Staff session                        | httpOnly cookies, read only by the BFF |

See [ADR 0002](decisions/0002-server-state-lives-in-tanstack-query.md).

---

## Error handling

Every failure reaches the UI as one type, `ApiError` in
`src/lib/repositories/errors.ts`, so components branch on one shape:

```ts
class ApiError extends Error {
  status: number; // HTTP status; 0 when no response arrived
  code: string; // the API's error.code
  details: Record<string, unknown>; // the API's error.details
  requestId: string | undefined; // X-Request-ID, shown to staff for support
}
```

| Condition                                        | `status` | `code`                |
| ------------------------------------------------ | -------- | --------------------- |
| The API answered with its error envelope         | as sent  | the API's `code`      |
| The BFF refused the path                         | 404      | `not_found`           |
| The BFF could not reach the API                  | 502      | `bad_gateway`         |
| A response that is not the envelope (proxy HTML) | as sent  | `unexpected_response` |
| No response at all (offline, DNS, aborted)       | 0        | `network_error`       |

Rules:

- The HTTP client's response interceptor converts every failure; nothing else
  catches Axios errors.
- TanStack Query retries network errors and 5xx at most twice, and never a 4xx.
- The route error page shows `message` and `requestId`; the request id is what lets
  a developer find the failure in the API's logs.
- Branch on `code`, never on `message`. The API's codes are listed in
  `back-end/docs/architecture.md#error-handling`.

See [features/api-error-contract.md](features/api-error-contract.md).

---

## External systems

| System      | Purpose                 | Integration point                 | Important constraint                                                                                     |
| ----------- | ----------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| TrueLux API | All data and all writes | `server/proxy.ts`, over `API_URL` | `/api/v1/` paths end in a slash; lists use limit/offset pagination (max 100); admin routes are JWT only. |

The contract is summarised in
[integrations/truelux-api.md](integrations/truelux-api.md); the back-end's own
documents are authoritative.

---

## Important constraints

Future implementation must preserve these:

- **No token in the browser.** Not in memory, not in storage, not in a response
  body. Only the BFF reads the session cookies.
- **The proxy is an allow-list.** A new API area is opened by adding its prefix to
  `ALLOWED_API_PATHS`, deliberately, never by widening it to `/api/v1/`.
- **Every API response is parsed with Zod** in a repository before it reaches a
  component.
- **Only repositories call the HTTP client**, and only `src/lib/repositories/`
  imports Axios.
- **Server data is never copied into Zustand or component state.**
- **List state lives in the URL**, so a list can be bookmarked and the back button
  works.
- **No secret is a `VITE_*` variable.**
- **The admin never computes a value the API owns.**

---

## Known architectural limitations

- **Sign-in does not exist yet.** The shell renders without a session and every API
  call returns 401 until the staff-auth feature lands.
- **The BFF has no production host.** `server/serve.ts` is a development entry
  point; the deployment shape (one Node service serving `dist/` and the BFF, or
  static hosting plus a function) is undecided.
- **One extra hop per call.** Every API request passes through the BFF. Acceptable
  for a back office, as back-end ADR 0012 already accepts.
- **The main bundle is about 530 kB (170 kB gzipped)**, mostly React, the router,
  Query and Radix. Vite warns about it on every build. Route-level code splitting is
  on; vendor chunking has not been needed yet.
- **The theme is applied by JavaScript.** There is no inline script in
  `index.html`, so a dark-mode user can see a light background for the instant
  before the bundle runs. Accepted to keep a strict CSP possible.
