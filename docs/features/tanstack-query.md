# Client data with TanStack Query

Status: Implemented

Last updated: 2026-10-11

---

## Goal

Give server data one lifecycle in the browser: a shared cache, background refetching
(polling for the order queue), filters and pages that do not reload the screen,
optimistic edits where safe, and one loading and error model (ADR 0002).

---

## Scope

What is included in this implementation?

- One `QueryClient` with defaults, `ApiError` as its error type, and the retry rule
- Route loaders that prefetch with `ensureQueryData`, so a page renders with its data
- Freshness classes: how long each kind of data stays fresh and whether it polls
- One invalidation map: what each admin change makes stale
- **Refresh data** in every page header
- A toast for a failed background refetch, once per query; a first-load failure
  reaches the route error page
- The rules for list state in the URL and for optimistic updates, which each list
  and mutation applies (built with orders and products)
- A fresh cache for each signed-in user

What is explicitly outside the scope?

- Infinite queries, cache persistence, offline mode
- A change feed (the API has none; see Gotchas)
- Session refresh, which is [staff-auth.md](staff-auth.md)'s

---

## Context

- Requirements ported from `../admin/docs/features/tanstack-query.md` (Implemented
  there). Its Route Handlers, `HydrationBoundary` and Next router-cache settings
  solved Next.js problems and do not apply: here the SPA calls the API directly
  (ADR 0005), and TanStack Router loaders prefetch.
- [ADR 0002](../decisions/0002-server-state-lives-in-tanstack-query.md) (who owns
  which state) and [../convention.md](../convention.md#queries-and-mutations) (key
  factories, `queryOptions`, mutation hooks).
- The API throttles staff at 2000 requests an hour; one polling tab costs about 60.

---

## Planned

None. The rules below are applied by each feature as it is built, and the work is
tracked in that feature's document: list state in [orders.md](orders.md) (the first
list) and [products.md](products.md), optimistic updates in
[products.md](products.md), and each feature's `meta.invalidates` in its own
document.

### Rules for features

- What each change leaves stale. Each feature's mutation hook names these keys in
  `meta.invalidates`, from the owning features' key factories (through their
  `index.ts`); this table is what they are checked against:

  | Change                                | Leaves stale                                                                         |
  | ------------------------------------- | ------------------------------------------------------------------------------------ |
  | taxonomy save/delete                  | that list, all products (they show taxonomy names)                                   |
  | product create                        | product lists, all taxonomy lists (counts)                                           |
  | product update/publish/delete         | its detail, product lists, all taxonomy lists                                        |
  | variant add/save/delete, stock change | as a product change, plus the dashboard (low stock) and stock history                |
  | image upload/move/alt/primary/delete  | its detail, product lists                                                            |
  | order transition                      | order lists, the dashboard, all products and stock history (a cancel restores stock) |
  | shipping settings                     | shipping settings                                                                    |

- Route search params validated with Zod in `validateSearch`; filters, search and
  page write the URL with `navigate({ search, replace: true })`, and pagination with
  a real `Link` so middle-click and new tabs work. A list keeps its old rows while the
  new page loads (`placeholderData: keepPreviousData`).
- A filter object is part of the key; normalise it (order repeated statuses) so the
  same filters share one entry.
- Optimistic updates only for image order, image alt text and the list's publish
  toggle, each rolling back and refetching on failure. Never for transitions, stock,
  prices or the primary image, which the API derives.
- Money stays a string in the cache; no `select` parses it.

---

## Implemented

- `src/lib/freshness.ts` — the `FRESHNESS` map every `queryOptions` spreads (in
  `lib`, because features import it):

  | Class       | Changed outside the admin?           | Queries                                 | Policy                                              |
  | ----------- | ------------------------------------ | --------------------------------------- | --------------------------------------------------- |
  | `live`      | constantly (new orders, other staff) | dashboard, orders list, order detail    | stale after 30 s; polled every 60 s while visible   |
  | `volatile`  | often (storefront orders move stock) | products list and detail, stock history | stale after 30 s; refetched when shown or refocused |
  | `reference` | rarely (other staff)                 | taxonomy lists, shipping settings, `me` | stale after 10 minutes                              |

  A query that names no class is `volatile` (the query client's default).
  `authQueries.me()` is `reference`.

- `src/app/query-client.ts`:
  - defaults: `FRESHNESS.volatile`; retries network errors and 5xx at most twice,
    never a 4xx; `ApiError` registered as the default error type
  - `QueryCache.onError` — when a query that already had data fails to refetch,
    `toast.error(describeError(error), { id: query.queryHash })`: one toast per
    query, replaced rather than stacked while a poll keeps failing. A failed first
    load reaches the route error page instead.
  - `MutationCache.onSuccess` — invalidates every key in `meta.invalidates`
    (`Register.mutationMeta`) and waits, so a mutation stays pending until the
    active queries have refetched and the screen shows the result
- `src/components/layout/refresh-button.tsx` — **Refresh data** in every
  `PageHeader`: `refetchQueries({ type: "active" })`, disabled with a spinner while
  anything active fetches, announcing "Data refreshed" in a polite live region when
  nothing failed.
- `src/features/auth/` — sign-in and sign-out clear the cache, so another sign-in
  in the same tab starts empty; an ended session is a full page load
  ([staff-auth.md](staff-auth.md)).
- `src/app/router.ts` — the query client in the router context, `defaultPreload:
"intent"`, `defaultPreloadStaleTime: 0` so Query, not the router, decides freshness.
- `src/app/providers.tsx` — `QueryClientProvider`, Query devtools in development.
- `src/components/feedback/route-error.tsx` — the first-load failure page.

---

## Remaining

None.

---

## Decisions

### Decision: freshness classes; admin changes invalidate

**Decision**

Each kind of data gets a time policy by how often it changes outside the admin; the
admin's own changes invalidate through one map.

**Reason**

Carried over from `../admin`. Invalidation covers only what the admin changes; the
storefront and other staff change orders and stock outside it. **Refresh data**
covers "I know it changed".

**Consequence**

A key a mutation forgets shows old data until its class's `staleTime` passes. The
table above lives in this document rather than in a central module, so features do
not import from `src/app/`.

### Decision: optimistic only where the API derives nothing

**Decision**

Image order, alt text and the publish toggle only.

**Reason**

The API is authoritative for transitions, stock, prices and the primary image (it
clears the old one).

**Consequence**

Other mutations show pending until the API answers.

---

## Gotchas

- `../admin` retried once; this app currently retries up to twice
  (`MAX_RETRIES`). Revisit if polling plus retries strains the throttle.
- A `volatile` page left open without refocusing does not refetch; stock can age until
  a refocus, a mutation or **Refresh data**.
- The API has no change feed, so polling and staleness are the only way to see
  outside changes. Raised as an open question in
  [../integrations/truelux-api.md](../integrations/truelux-api.md#open-questions).
- A cancelled query does not toast, with no check of our own: Query's
  `CancelledError` path returns the old data instead of calling `onError`, and a
  query cancelled before its first data has nothing to keep, so the toast's
  `data !== undefined` guard skips it.

---

## API

None of its own; it shapes how every feature calls the API.

---

## Data changes

- Query keys per feature, from each feature's key factory.
- URL search params per list route.

---

## Permissions

None.

---

## Tests

- `src/app/query-client.test.tsx` — repeated refetch failures of one query show one
  toast; a failed first load shows none; `meta.invalidates` invalidates only the
  named keys and the mutation stays pending until the active query has refetched.
- `src/components/layout/refresh-button.test.tsx` — refetches the queries on screen
  and announces the refresh.

Planned with their callers: an optimistic image reorder rolls back on failure;
status order does not split a list key.

---

## Files

```text
src/app/query-client.ts
src/app/router.ts
src/app/providers.tsx
src/lib/freshness.ts
src/components/layout/refresh-button.tsx
src/features/*/queries/*.mutations.ts      per feature
```

---

## Future context

None.
