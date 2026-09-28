# Client data with TanStack Query

Status: Implemented

Last updated: 2026-09-28

---

## Goal

Give server data a lifecycle in the browser: a shared cache, background refetching
(polling for the order queue), filters and pages that do not re-render the route,
optimistic edits in the product editor, and one loading/error model. The browser
still never talks to the Django API and never sees a token
([ADR 0005](../decisions/0005-client-data-uses-tanstack-query.md)).

Before this, the admin had no `useEffect` + `useState` fetching to remove. Every read
was a Server Component call and every mutation ended in `revalidatePath`. What this
feature adds is client caching and refetching.

---

## Scope

Included:

- `@tanstack/react-query` v5, with a provider in `(admin)/layout.tsx`.
- Read-only Route Handlers under `app/api/**`, one per `lib/api` read.
- Session refresh for `/api/*` done once per tab in the browser, not in `proxy.ts`.
- Every data page prefetches on the server and hands the cache over through
  `HydrationBoundary`; after that the client owns the data.
- List filters, search, tabs and pagination written to the URL with the History API.
- Every mutation is `useMutation` over the unchanged server actions, then
  invalidation. `revalidatePath` is gone.
- A visited route is reused by Next's router until reload, so navigating back makes no
  server render and no API call; data is refreshed in the background by freshness
  class (see Decisions), and every page has a **Refresh data** button.
- Optimistic updates for image order, image alt text and the list's publish toggle.
- Taxonomy search filters the cached array in the browser.

Out of scope:

- Browser → Django calls, CORS, tokens in JavaScript.
- Infinite queries, persistence, offline mode, Cache Components.
- `GET auth/me/` in the layout and the login flow, which stay server-side.

---

## Context

- `lib/api/client.ts` is `server-only`. `apiRead` redirects to `/login?expired=1` on
  401/403 (for Server Components). `apiGet` throws instead (for Route Handlers, whose
  `fetch` caller cannot follow a redirect to HTML). `apiWrite` refreshes once.
- `proxy.ts` guards every request. Pages are refreshed there; `/api/*` is not (see
  Decisions).
- The Next 16 guide this follows is
  `node_modules/next/dist/docs/01-app/02-guides/client-side-data-fetching/tanstack-query.md`.
- Refresh tokens rotate and are blacklisted, which is why two refreshes may never
  share a token (architecture.md, Known limitations).

---

## Implemented

Foundation:

- `next.config.ts` — `experimental.staleTimes.dynamic: Infinity`: the client router
  reuses a visited route's server render until the tab reloads.
- `lib/query/client.ts` — `FRESHNESS` (the three classes below), `QUERY_DEFAULTS`
  (`volatile` unless a query says otherwise, `gcTime: Infinity`, `retry` once only
  for `ApiUnreachableError` or a 5xx, never for an API code), the `mutationMeta` type
  (`invalidates`), and `invalidatingMutationCache()`: after any successful mutation it
  invalidates the keys in `meta.invalidates` and waits for the active ones to
  refetch.
- `lib/query/invalidation.ts` — the one map of what each admin change leaves stale
  (`afterTaxonomyChange`, `afterProductChange`, `afterProductCreate`,
  `afterVariantChange`, `afterImageChange`, `afterOrderMove`, `afterSettingsChange`).
- `components/shell/RefreshButton.tsx` — in every `PageHeader`: refetches the active
  queries (`refetchQueries({ type: "active" })`), shows a spinner and is disabled
  while any is fetching, and announces "Data refreshed" in a polite live region.
- `components/shell/QueryProvider.tsx` — a fresh client per server render, one in the
  browser. Its `QueryCache.onError` toasts a failed background refetch (the query
  already had data), one toast per query id so a failing poll does not stack them;
  a first-load failure reaches the error boundary instead.
- `lib/query/server.ts` — `getServerQueryClient`, one per request (React `cache`).
- `lib/query/get-json.ts` — `getJson(path, query, signal)`, the browser's only
  fetcher, on an axios instance ([convention.md](../convention.md#http)). It parses failures with `toApiError`. On `session_refresh_required` it
  shares one in-flight `POST /api/session` across every waiting query and retries
  once. On a failed refresh or a 401/403 it does a full load of
  `/login?expired=1&next=<path>`.
- `lib/query/action.ts` — `throwOnFailure` (an `ActionResult` failure becomes an
  `ActionFailureError`) and `failureMessage` (the sentence to show, or `null` for
  Next's redirect signal).
- `lib/api/route.ts` — `respond(work)`: data as `private, no-store` JSON. An
  `ApiError` goes back in the API's own envelope with its status and `X-Request-ID`;
  an unreachable API becomes 502 `api_unreachable`. `errorResponse` builds the same
  envelope for `proxy.ts` and handlers.
- `lib/api/{dashboard,orders,products,taxonomy}.ts` — each read takes an optional
  `read` (`apiRead` by default; handlers pass `apiGet`).
- `proxy.ts` — on `/api/*`: no refresh cookie → 401 `authentication_failed` JSON;
  access token missing or under 60 s → 401 `session_refresh_required`, with no
  refresh; `/api/session` passes through.
- `app/api/session/route.ts` — `POST`: same-origin check, rotate, write cookies, 204.
  A refused refresh answers 401 and leaves the cookies alone.
- `components/shell/LoadFailure.tsx` — **Try again** resets failed queries
  (`useQueryErrorResetBoundary`) before Next's `retry()`.
- `lib/search-params.ts` — `toSearch` (shared by `lib/api/client.ts` and `getJson`)
  and `paramsRecord` (URLSearchParams → `SearchParams`).

Areas (queries in `lib/<area>/queries.ts`, one GET handler per read):

| Key                                            | Handler                    | View                                                          |
| ---------------------------------------------- | -------------------------- | ------------------------------------------------------------- |
| Key (freshness)                                | Handler                    | View                                                          |
| ---------------------------------------------- | -------------------------- | ------------------------------------------------------------- |
| `["dashboard"]` (live)                         | `/api/dashboard`           | `components/dashboard/DashboardView.tsx`                      |
| `["orders","list",filters]` (live)             | `/api/orders?…`            | `components/orders/OrdersView.tsx`                            |
| `["orders","detail",id]` (live)                | `/api/orders/[id]`         | `components/orders/OrderView.tsx`                             |
| `["products","list",filters]` (volatile)       | `/api/products?…`          | `components/products/ProductsView.tsx`                        |
| `["products","detail",id]` (volatile)          | `/api/products/[id]`       | `components/products/ProductView.tsx`                         |
| `["taxonomy",kind]` (reference)                | `/api/taxonomy/[kind]`     | taxonomy tables, `NewProductView`, product filters and editor |
| `["settings","shipping"]` (reference)          | `/api/settings/shipping`   | `components/settings/ShippingSettingsForm.tsx`                |

- List handlers read the admin's own URL filters (`/api/orders?status=…&page=2`,
  built by `ordersHref`/`productsHref`) and map them with the same
  `parse*Filters`/`to*Query` as the page.
- Pages `await fetchQuery` (or `setQueryData` after `findOrder`/`findProduct`, which
  keep `notFound()`), then render `HydrationBoundary`. `lib/taxonomy/prefetch.ts`
  prefetches taxonomy lists.
- Taxonomy tables read their own rows through `useTaxonomySearch(kind)`
  (`select: matchingName(items, q)`). `CategoryDialog` derives its parent options from
  the cached categories. `useTaxonomyOptions(kind)` gives select options.
- Headers that show data (order number and status, product name and badge) live in
  the client views.

URL state:

- `useUrlParams().update` writes with `history.replaceState`, and `go` with
  `pushState`, both inside `startTransition`. Next syncs `useSearchParams` in a
  transition, so a list whose new key suspends keeps its old rows, and `isPending`
  (the `UrlSearch` spinner) lasts until the new rows render.
- `TablePagination` is a client component. It keeps real hrefs and takes over only an
  unmodified primary click.

Mutations:

- `useActionForm` and `ConfirmAction` run on `useMutation` and take `invalidates`.
  `RecordDialog` passes it through.
- Every mutation takes its keys from `lib/query/invalidation.ts`:

  | Change                               | Leaves stale                                                       |
  | ------------------------------------ | ------------------------------------------------------------------ |
  | taxonomy save/delete                 | that list, all products (names)                                    |
  | product create                       | product lists, all taxonomy lists (counts)                         |
  | product update/publish/delete        | its detail, product lists, all taxonomy lists                      |
  | variant add/save/delete              | as a product change, plus the dashboard (low stock)                |
  | image upload/move/alt/primary/delete | its detail, product lists                                          |
  | order move                           | order lists, the dashboard, all products (a cancel restores stock) |
  | shipping settings                    | shipping settings                                                  |

- `OrderActions` also writes the returned order into its detail key;
  `ProductDetailsForm` writes the returned product into its detail key and, after a
  create, navigates to `?tab=variants`. A deleted product's detail is invalidated,
  not removed (see Gotchas).
- Optimistic: `useImageMutation` (image order, alt text) and the list's publish
  toggle in `ProductRowActions`. Both roll back and refetch on failure.
- Server actions no longer revalidate. `createProductAction` returns the product
  instead of redirecting, and the variant and image actions lost their unused
  `productId`.

---

## Remaining

- The Playwright specs were not run for this change: the API was not running.
  Run `yarn e2e` against the seeded API before release.
- No Playwright spec yet for polling (an order moved in a second context appears in
  `/orders`).
- The cross-tab refresh race remains: two tabs can each refresh at the same moment.
  Removing it needs a backend grace period for reused refresh tokens.
- Backend: stale writes (a variant save can overwrite a storefront stock change made
  while staff edit) and a change feed, which would replace timed refetching; see
  [backend-api.md](../integrations/backend-api.md#open-questions).
- The router-cache reuse and background refresh were verified by tests only, not yet
  in a production build against the live API (see Manual checks).

---

## Decisions

### Decision: the browser reads through Route Handlers on the admin's origin

**Decision**

`queryFn`s fetch `/api/*` Route Handlers that call `lib/api`.

**Reason**

It keeps ADR 0001's guarantees. Server actions are POST-only, run one at a time,
and are not meant for reads.

**Consequence**

A second public server surface, guarded by `proxy.ts`, returning `private, no-store`
JSON.

### Decision: `/api/*` never refreshes on the server; the browser does it once

**Decision**

`proxy.ts` answers `session_refresh_required`; `getJson` shares one
`POST /api/session` per tab, then retries.

**Reason**

Focus refetch and polling send parallel requests, and a server-side refresh in each
would race on the rotating refresh token.

**Consequence**

One extra round trip every 15 minutes. Page navigations still refresh in `proxy.ts`.

### Decision: a refused refresh keeps the cookies

**Decision**

`POST /api/session` answers 401 without clearing the session cookies.

**Reason**

Another tab may have just rotated the pair. Clearing it would sign every tab out.
This matches `proxy.ts`, which also does not clear on a failed refresh.

**Consequence**

The tab goes to `/login?expired=1`, which the proxy lets through. A reload recovers
if another tab won the race.

### Decision: mutations name the queries they make stale

**Decision**

`useMutation({ meta: { invalidates } })`. One `MutationCache` invalidates the keys
and waits for active queries to refetch.

**Reason**

One mechanism for every form, dialog and button, and the button stays pending until
the screen shows the result.

**Consequence**

A mutation that forgets `invalidates` leaves stale data until the next focus or
stale refetch.

### Decision: visited routes are reused until reload

**Decision**

`experimental.staleTimes.dynamic = Infinity`.

**Reason**

Next 16 keeps dynamic pages in its router cache for 0 s, so every navigation
re-rendered the page on the server, whose fresh per-request `QueryClient` fetched from
the API again behind the `loading.tsx` skeleton, although the browser held the data.
After the first render TanStack Query keeps the data fresh, so the server render is
reused.

**Consequence**

The server fetches on a first visit to a URL, a reload, or after Next purges its
router cache (a Server Action that writes cookies, such as `apiWrite`'s refresh). The
reused payload's dehydrated data is as old as the first visit; `HydrationBoundary`
never lets it overwrite newer cached data (`lib/query/hydration.test.tsx`).

### Decision: freshness classes; admin changes invalidate

**Decision**

Every query spreads one class from `FRESHNESS`:

| Class       | Changed outside the admin?           | Queries                              | Policy                                              |
| ----------- | ------------------------------------ | ------------------------------------ | --------------------------------------------------- |
| `live`      | constantly (new orders, other staff) | dashboard, orders list, order detail | stale after 30 s; polled every 60 s while shown     |
| `volatile`  | often (storefront orders move stock) | products list and detail             | stale after 30 s; refetched when shown or refocused |
| `reference` | rarely (other staff)                 | taxonomy lists, shipping settings    | stale after 10 min                                  |

Stale data renders from the cache and is replaced when the background refetch lands.
The admin's own changes invalidate through `lib/query/invalidation.ts`.

**Reason**

Invalidation covers only what the admin changes. The storefront and other staff
change orders and stock outside it, so each kind of data gets a time policy by how
volatile it is, and **Refresh data** covers "I know it changed".

**Consequence**

A query that names no class is `volatile`. A missing key in the invalidation map
shows old data until the class's `staleTime` passes.

### Decision: the server prefetch is awaited

**Decision**

`await fetchQuery` (or `setQueryData`), not a streamed pending query.

**Reason**

It keeps `notFound()`, `error.tsx` and `loading.tsx` behaving as before.

**Consequence**

The first paint waits for the data, as before.

### Decision: filters and pages use the History API

**Decision**

`replaceState`/`pushState` inside a transition, not `router.replace` or `Link`
navigation.

**Reason**

A router navigation re-runs the dynamic page on the server and fetches twice.

**Consequence**

The URL stays the source of truth. A hard load or a link from another page still
renders on the server.

### Decision: optimistic only where the API derives nothing

**Decision**

Image order, alt text, the publish toggle. Not transitions, stock, prices or the
primary image (the API clears the old one).

**Reason**

The API is authoritative (CLAUDE.md, ADR 0003).

**Consequence**

Other mutations show pending until the API answers.

---

## Gotchas

- `useSuspenseQuery` has no `placeholderData`. A list keeps its old rows on a filter
  change only because the URL update happens inside a transition. A URL change made
  outside one would show the `loading.tsx` skeleton.
- A filter object is the key. `parseOrderFilters` returns statuses in the API's
  order, once each, so `?status=b&status=a` and `?status=a&status=b` share an entry.
- `lib/<area>/queries.ts` must not import `lib/api/*` or `server-only`. Types come
  from `lib/api/types.ts`.
- A `HydrationBoundary` must wrap every component that reads its queries, including
  a header dialog. The taxonomy pages wrap the whole page.
- A server action that redirects rejects on the client with Next's redirect signal
  while the router navigates. `failureMessage` returns `null` for it, so it is never
  toasted.
- `lib/api/media.ts#mediaUrl` still runs in `lib/api`, so image and logo URLs are
  absolute in both the dehydrated state and handler responses.
- The login redirect in `getJson` is a full page load on purpose. It drops the
  cached staff data along with the session (an `eslint-disable` names why).
- Money stays a string in the cache; no `select` parses it.
- A reused route skips `proxy.ts`, so an expired access token is noticed by the next
  `/api/*` query (one shared refresh), not by navigation.
- A new URL is a first visit with a server render: a dashboard status link, another
  product, a linked `?page=2`. Filters and pages changed on the page stay client-only.
  The first visit to `/products/[id]` prefetches the five taxonomy lists even when the
  browser has them.
- A deleted product's detail is invalidated rather than removed: a removed query
  would be hydrated again from the reused route's first render.
- A `volatile` page left open without refocusing does not refetch; stock there can
  age until a refocus, a mutation or **Refresh data**.
- The browser keeps one `QueryClient` per signed-in user id (`QueryProvider`), so a
  different sign-in in the same tab starts from an empty cache; `gcTime` is
  `Infinity` otherwise.
- A cancelled query rejects with axios's cancel, not `ApiUnreachableError`;
  otherwise every abandoned query would toast "could not be reached".

---

## Routes

```text
/  /orders  /orders/[id]  /products  /products/new  /products/[id]
/brands  /categories  /shades  /sizes  /skin-types
                        dynamic; server prefetch + HydrationBoundary
/api/dashboard  /api/orders  /api/orders/[id]  /api/products  /api/products/[id]
/api/taxonomy/[kind]    GET, dynamic, private no-store JSON, behind proxy.ts
/api/session            POST, same-origin only; rotates the token pair
```

---

## API

### Calls

```text
GET  /api/v1/admin/dashboard/         server render; browser via /api/dashboard, polls 60 s
GET  /api/v1/admin/orders/            server render; browser via /api/orders, polls 60 s
GET  /api/v1/admin/orders/{id}/       server render; browser via /api/orders/[id]
GET  /api/v1/admin/products/          server render; browser via /api/products
GET  /api/v1/admin/products/{id}/     server render; browser via /api/products/[id]
GET  /api/v1/admin/{kind}/            server render; browser via /api/taxonomy/[kind]
POST /api/v1/auth/token/refresh/      proxy.ts (pages); /api/session (browser)
writes                                server actions, unchanged
```

### Errors handled

| `code`                                               | Treatment                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| `session_refresh_required` (admin-local)             | one shared `POST /api/session`, then one retry                      |
| `authentication_failed`, `permission_denied` (reads) | full load of `/login?expired=1&next=…`                              |
| `api_unreachable` (admin-local, 502)                 | one retry; then the error boundary or a background toast            |
| any, on a background refetch                         | toast `describeError`; the cached data stays                        |
| `not_found` on a detail prefetch                     | `notFound()`                                                        |
| mutation codes                                       | unchanged; see [architecture.md](../architecture.md#error-handling) |

---

## State and data

- URL search params: unchanged keys, written with the History API.
- TanStack Query cache: in memory, per tab, lost on reload. Nothing is persisted.
- React state: dialogs, form values, drafts; pending state is the mutation's
  `isPending`.

---

## Accessibility

- Pagination links keep real hrefs; keyboard, middle-click and new-tab still work.
- The `aria-live` result count re-announces only when the count text changes;
  structural sharing keeps an unchanged poll result identical.
- A background refetch does not remount an open dialog's form; the form still starts
  from the row's values when opened.

---

## Tests

- `lib/query/get-json.test.ts` — query strings; three concurrent
  `session_refresh_required` answers cause one refresh; a refused refresh or a 403
  sends the tab to `/login?expired=1` with a safe `next`; other codes pass through;
  a failed connection is `ApiUnreachableError`; a cancelled query rejects as a
  cancel.
- `lib/api/route.test.ts` — envelope, status and `X-Request-ID`; 502
  `api_unreachable`; `private, no-store`; other errors rethrown.
- `proxy.test.ts` — the `/api/*` branch: JSON 401s, no refresh, `/api/session` let
  through.
- `app/api/session/route.test.ts` — rotation writes both cookies; cross-origin is
  refused; a refused refresh keeps the cookies.
- `lib/query/queries.test.ts` — status order does not split a key; pages do.
- `components/orders/OrderActions.test.tsx` — the returned order lands in the cache;
  lists and the dashboard are invalidated.
- `components/taxonomy/SkinTypesTable.test.tsx` — search filters the cache with no
  request; a delete refetches the list.
- `components/products/ImagesManager.test.tsx` — a reorder is optimistic and rolls
  back on failure.
- `components/products/ProductRowActions.test.tsx` — publish is optimistic and rolls
  back on `product_has_no_variants`.
- `components/data-table/url-controls.test.tsx` — `replaceState` for filters;
  `pushState` for a plain pagination click, none for a modified one.
- `components/shell/LoadFailure.test.tsx` — **Try again** resets queries, then
  retries.

### Manual checks

With the API running and `yarn dev`:

- Filter and page `/orders`: only `/api/orders?…` requests, no RSC request; the old
  rows stay until the new ones arrive.
- Leave the dashboard open and move an order elsewhere: it updates within 60 s.
- Delete `tl_access` and refocus: exactly one `POST /api/session`, then the
  refetches succeed.
- Delete `tl_refresh` and refocus: `/login?expired=1&next=…`.
- Reorder images with the API stopped: the card moves, then moves back with a toast.

---

## Files

```text
app/api/                         dashboard, orders, products, taxonomy, session handlers
app/(admin)/**/page.tsx          prefetch + HydrationBoundary
components/shell/QueryProvider.tsx  LoadFailure.tsx
components/*/…View.tsx           client views
components/taxonomy/use-taxonomy-search.ts  use-taxonomy-options.ts
components/products/use-image-mutation.ts
components/data-table/use-url-params.ts  TablePagination.tsx
components/form/use-action-form.ts  ConfirmAction.tsx  RecordDialog.tsx
lib/query/                       client, server, get-json, action
lib/{dashboard,orders,products,taxonomy}/queries.ts
lib/taxonomy/prefetch.ts
lib/api/route.ts  client.ts (apiGet, Reader)
proxy.ts
tests/fixtures/query.tsx
```

---

## Future context

- Every read is `no-store` and Cache Components are off, so the `use cache` hydration
  helper in the Next guide does not apply.
- Polling costs about 60 requests an hour per open dashboard or orders tab, against the
  `2000/hour` staff throttle.
- A new list page: add a key and `queryOptions` in `lib/<area>/queries.ts`, a GET
  handler through `respond`, a `fetchQuery` + `HydrationBoundary` page, and a client
  view reading `useSearchParams`. A new mutation: a server action returning
  `ActionResult`, wrapped in `useMutation` with `meta.invalidates`.
