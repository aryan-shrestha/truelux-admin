# Architecture

Last updated: 2026-10-11

This document describes the current architecture of the system.

It should describe durable architectural facts, not implementation history or a
tutorial for the entire codebase.

---

## System overview

TrueLux admin v2: the staff back office for a multi-brand cosmetics store. A static
React single-page app that calls the TrueLux Django API (`../back-end`) from the
browser. The API owns every piece of data (ADR 0005).

```text
Browser (React SPA, static files)
  │  Authorization: Bearer <access>, CORS
  ↓
TrueLux API (Django REST Framework)
  ├── /api/v1/auth/token/, /token/refresh/, /logout/, /me/
  └── /api/v1/admin/*
```

Three properties define this architecture:

- **One module holds the credentials.** The access and refresh tokens live in
  `localStorage`, read and written only through `src/lib/repositories/session.ts`.
  The HTTP client attaches and refreshes the access token, and the auth repository
  stores the pair on sign-in and revokes it on sign-out; nothing else sees either
  token. This is back-end ADR 0020's arrangement, with its XSS trade-off.
- **The admin owns no data.** Prices, stock, totals, order state and allowed
  transitions come from the API. The admin renders them and never computes a
  substitute.
- **Server state lives in TanStack Query.** The URL holds list state, Zustand holds
  UI preferences, React Hook Form holds form drafts, and nothing else stores data
  (ADR 0002).

---

## Application structure

```text
src/
    main.tsx          applies the theme, creates the query client and router, renders
    app/              providers, router, query client: wiring only
    routes/           file routes; routeTree.gen.ts is generated from them
    features/         one folder per domain (ADR 0003)
    components/
        ui/           shadcn, generated
        layout/       app sidebar, top bar, page header, refresh button
        data-table/   DataTable (paginated or whole-array lists), SearchInput
        form/         react-hook-form fields bound by name, showApiError
        feedback/     route error, not-found and pending pages, ConfirmDialog,
                      EmptyState
    lib/
        repositories/ client.ts (the Axios instance), session.ts (the tokens),
                      errors.ts, pagination.ts
        env.ts        Zod-validated VITE_* variables (ADR 0004)
        freshness.ts  staleTime / polling classes every queryOptions spreads
        money.ts      formatMoney and MONEY_PATTERN: decimal strings, never floats
        image-upload.ts  the API's image rules (type, 5 MB) for uploads
        date.ts       dates in the browser's zone; the shop's Kathmandu days
        theme.ts      applies the theme preference to <html>
        cn.ts         class-name helper used by shadcn
    stores/           ui.store.ts
    config/           navigation.ts
    styles/           globals.css: Tailwind v4 and the theme tokens
    test/             Vitest setup and the MSW server
e2e/                  Playwright specs
docs/
```

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
httpClient (Axios, baseURL {VITE_API_URL}/api/v1/, adds the bearer token)
    ↓
TrueLux API
    ↓
401 → one shared refresh per tab, then one retry
    ↓
ApiError on failure / parsed data on success
    ↓
TanStack Query cache → component
```

Deviations from this flow:

- **Sign-in and sign-out** are repository calls in `src/features/auth/` that also
  write or clear the stored tokens.
- **The token endpoints** (`auth/token/`, `auth/token/refresh/`) get no bearer token
  and never trigger a refresh.

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

**Authentication.** Staff sign in with email and password: the SPA calls
`POST /api/v1/auth/token/` and stores the returned pair in `localStorage`
(`session.ts`). Every other call carries `Authorization: Bearer <access>`.

**Refresh.** The access token lives 15 minutes. A 401 makes the client's response
interceptor call `POST /api/v1/auth/token/refresh/` once for every waiting request
in the tab, store the rotated pair and retry each request once. Refresh tokens
rotate and the old one is blacklisted, so before refreshing, and after a refused
refresh, the client checks whether another tab has already stored a newer pair and
uses it. A refused refresh or a 403 clears the tokens and loads
`/login?expired=1&next=…`.

**Authorization** belongs to the API: every `/api/v1/admin/` route requires an
active staff user, and there are no finer roles (back-end `staff-auth.md`). The
admin does not hide or show features by role. The `_dashboard` route guard is
navigation, not authorization.

---

## State ownership

| State                                | Owner                                 |
| ------------------------------------ | ------------------------------------- |
| Anything the API returns             | TanStack Query cache                  |
| Page, page size, sort, filters, tabs | URL search params, validated with Zod |
| Form drafts and validation           | React Hook Form + Zod                 |
| Sidebar open, theme preference       | Zustand (`ui.store.ts`), persisted    |
| Staff tokens                         | `localStorage`, `session.ts` only     |

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
| A response that is not the envelope (proxy HTML) | as sent  | `unexpected_response` |
| No response at all (offline, DNS, CORS refusal)  | 0        | `network_error`       |

Rules:

- The HTTP client's response interceptor converts every failure; nothing else
  catches Axios errors.
- TanStack Query retries network errors and 5xx at most twice, and never a 4xx.
- The route error page shows `message` and `requestId`; the request id is what lets
  a developer find the failure in the API's logs. The API exposes `X-Request-ID` to
  the admin's origin through CORS.
- `describeError` maps a `code` to the sentence staff see in toasts and alerts.
- Branch on `code`, never on `message`. The API's codes are listed in
  `back-end/docs/architecture.md#error-handling`.

See [features/api-error-contract.md](features/api-error-contract.md).

---

## External systems

| System      | Purpose                 | Integration point                                     | Important constraint                                                                                                                                                |
| ----------- | ----------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TrueLux API | All data and all writes | `src/lib/repositories/client.ts`, over `VITE_API_URL` | `/api/v1/` paths end in a slash; lists use limit/offset pagination (max 100); admin routes are JWT only; the admin origin must be in `DJANGO_CORS_ALLOWED_ORIGINS`. |

The contract is summarised in
[integrations/truelux-api.md](integrations/truelux-api.md); the back-end's own
documents are authoritative.

---

## Important constraints

Future implementation must preserve these:

- **Tokens go through `session.ts` only**, called by the HTTP client and the auth
  repository. Never log, render, or put them in a URL or query key; never add `dangerouslySetInnerHTML` or a runtime third-party script,
  because any script on the origin can read them (ADR 0005).
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

- **An XSS can steal the session.** Both tokens are readable by script on the admin
  origin, and a stolen refresh token that keeps being refreshed does not expire
  (back-end ADR 0020). Deactivating the user or removing `is_staff` ends it.
- **Each environment needs a CORS entry.** The admin's origin must be in the API's
  `DJANGO_CORS_ALLOWED_ORIGINS`; otherwise every call is a `network_error` that
  never reaches the API's logs.
- **The entry chunk is about 280 kB (87 kB gzipped)**, mostly React, the router,
  Query and Radix. Route-level code splitting is on: Recharts (about 100 kB gzipped)
  loads only with the dashboard, the calendar with orders. It depends on
  `"sideEffects": ["*.css"]` in `package.json`, because route loaders import feature
  barrels; vendor chunking has not been needed yet.
- **The theme is applied by JavaScript.** There is no inline script in
  `index.html`, so a dark-mode user can see a light background for the instant
  before the bundle runs. Accepted to keep a strict CSP possible.
