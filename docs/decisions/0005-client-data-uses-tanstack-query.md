# ADR 0005: Client data uses TanStack Query

Status: Accepted

Date: 2026-09-27

Supersedes: None. Amends [ADR 0001](0001-auth-is-a-backend-for-frontend.md)'s
"interactive tables re-render through URL search params, not client fetches".

---

## Context

Every read was a Server Component call and every mutation ended in
`revalidatePath`, so each filter change, page turn or save re-rendered the route on
the server. The admin had no shared browser cache and no background refetching, so a
new order appeared only after a reload. Nothing could be optimistic.

The browser must still never hold a token or call the Django API (ADR 0001).

---

## Decision

TanStack Query v5 owns server data in the browser.

- Server Components prefetch the first view into a per-request `QueryClient` and hand
  it over with `HydrationBoundary`.
- In the browser, `queryFn`s fetch read-only Route Handlers under `app/api/**` on the
  admin's origin. Each handler calls one `lib/api` function.
- Mutations stay server actions, wrapped in `useMutation`, followed by
  `invalidateQueries` instead of `revalidatePath`.
- `/api/*` requests never refresh the token on the server. `proxy.ts` answers
  `session_refresh_required`, and the browser makes one shared `POST /api/session`
  per tab, then retries.
- List filters and pages are written to the URL with the History API, so a change is
  a client query and not a server render.

---

## Reason

- A shared cache, focus refetch, polling, keep-previous-data pagination and
  optimistic rollback are what TanStack Query provides; rebuilding them by hand
  would be worse.
- Route Handlers keep ADR 0001's guarantees: tokens stay in httpOnly cookies,
  `lib/api` stays `server-only`, and the API needs no CORS.
- Refresh tokens rotate and are blacklisted. Background refetches send parallel
  requests, and a server-side refresh in each would race and sign the user out.

---

## Alternatives considered

### Server actions as `queryFn`

Why it was not chosen: server actions are POST-only, run one at a time per client,
and are meant for mutations. Reads would lose caching semantics and parallelism.

### Keep refreshing in `proxy.ts` for `/api/*`

Why it was not chosen: that is the concurrent-refresh race documented in
architecture.md, and polling and focus refetch would hit it every 15 minutes.

### A generic `/api/[...path]` passthrough

Why it was not chosen: it would expose every admin endpoint and method to browser
JavaScript. One explicit GET handler per read keeps the surface typed and small.

---

## Consequences

### Positive

- Orders and the dashboard update without a reload.
- Filters and pages are client-only fetches with the previous data kept on screen.
- Taxonomy search filters the cached array and makes no request.

### Negative

- A second public server surface (`app/api/**`) to guard and test.
- More client JavaScript and more client components.
- Expired sessions on `/api/*` cost one extra round trip every 15 minutes.

### Constraints introduced

- `lib/<domain>/queries.ts` is the one place a query key is built. The server
  prefetch and the client read share it.
- Query modules never import `lib/api/*` or `server-only`.
- `lib/api/route.ts#respond` is the second allowed `try`/`catch` around API calls,
  after `attempt()`.
- Optimistic updates only for values the API does not derive.

---

## Implementation

```text
lib/query/
lib/<domain>/queries.ts
lib/api/route.ts
app/api/
proxy.ts
components/shell/QueryProvider.tsx
docs/features/tanstack-query.md
```

---

## Future reconsideration

- If the backend adds a grace period for reused refresh tokens, `/api/*` could
  refresh in `proxy.ts` again.
- If reads become cacheable across users (they are not: data is per staff user and
  operational), Cache Components with `use cache` would sit behind this.
