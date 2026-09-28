# Code Conventions

Last updated: 2026-09-28

This document records conventions that apply across the repository.

Prefer existing code examples over adding rules here. Only record conventions that
future contributors or agents need to know.

See [architecture.md](architecture.md) for layer responsibilities and system
constraints. This file covers how the code is written, not how it is arranged.

---

## Naming

### Files

Components are `PascalCase.tsx`, named for the component they export. Everything
else is `kebab-case.ts`. Directories are `kebab-case`. shadcn's generated files keep
their own `kebab-case.tsx` names in `components/ui/`.

```text
components/products/VariantsEditor.tsx
components/form/use-action-form.ts      a hook
lib/api/products.ts                     the product endpoints
lib/products/actions.ts                 the product server actions
lib/products/queries.ts                 the product query keys and queryOptions
lib/products/schemas.ts
lib/format/money.ts
```

One concern per module. **No `utils.ts`, `helpers.ts` or `common.ts`**; shadcn's
`lib/utils.ts` exports only `cn`. A helper with no obvious home belongs next to its
only caller.

A component file exports one component. A small component used only by it may live
in the same file (`HexField` in `ShadeDialog.tsx`).

### Functions

`lib/api` functions are named for what they return, in the API's vocabulary: `get*`
for one thing, `list*` for many, an imperative verb for a write (`createProduct`,
`transitionOrder`). Server actions are named for the merchant's intent
(`saveBrand`, `setPublished`, `moveOrder`, `signIn`).

Arguments are a single object where there are several of them.

### Variables

`camelCase`, plural collections, booleans that read as assertions (`isPending`,
`hasPrimary`). Module constants are `UPPER_SNAKE_CASE` at the top of their module.

---

## Server and client components

**Server by default.** Every `"use client"` names the interaction it enables.

- A server page prefetches into `getServerQueryClient()` and renders a client view
  inside `HydrationBoundary`. The view reads with `useSuspenseQuery` and the same
  `queryOptions`; the server spreads them and overrides `queryFn` with the
  `lib/api` call.
- A client component writes through a server action inside `useMutation`.
- **Never export a constant or helper from a `"use client"` file for a server
  component to use.** On the server it becomes a client reference, and calling it
  throws at runtime. Put it in `lib/` (see `lib/products/query.ts#parseProductTab`).
- A server component may pass JSX (a `Button` as a dialog `trigger`) to a client
  component.
- No `useEffect` to fetch or to mirror props into state.

## Queries

```ts
export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};
```

- One `lib/<domain>/queries.ts` per area: a key factory (entity → list/detail →
  params) and `queryOptions`. Each `queryOptions` spreads a class from `FRESHNESS`,
  chosen by asking "what outside the admin changes this, and how often?". It imports types from `lib/api/types.ts`, never
  `lib/api/*` or `server-only`.
- A key's params are the parsed filter object (`parse*Filters`), never raw search
  params.
- `queryFn` calls `getJson` with the `signal`. List handlers take the admin's own URL
  filters (`/api${ordersHref(filters)}`).
- Pages `await fetchQuery` (or `setQueryData` after a `find*` that maps `not_found`
  to `notFound()`), never `prefetchQuery`, so failures reach `error.tsx`.
- Wrap everything that reads a prefetched query, a header dialog included, in the
  `HydrationBoundary`.

---

## The API module

```ts
export async function listProducts(query: ProductQuery): Promise<Page<ProductListItem>> {
  return apiRead<Page<ProductListItem>>("/admin/products/", query);
}

export async function deleteProduct({ id }: { id: string }): Promise<void> {
  return apiWrite<void>(productPath(id), { method: "DELETE" });
}
```

- **`apiRead` in Server Components, `apiGet` in Route Handlers, `apiWrite` in server
  actions.** Only `apiWrite` may refresh tokens. A read takes `read` as its last
  argument (`listOrders(query, apiGet)`).
- A Route Handler is `respond(() => read(..., apiGet))`, and nothing else.

### HTTP

Requests go through axios. There are two instances and no others:
`lib/api/client.ts` (server → API, `baseURL` from `env`) and `lib/query/get-json.ts`
(browser → the admin's `/api/*`).

- `adapter: "fetch"` with `fetchOptions: { cache: "no-store" }`. It keeps Next's
  patched `fetch` on the server, runs in `proxy.ts`, and lets tests stub `fetch`.
- `validateStatus: () => true`: every status resolves, and the caller turns a non-2xx
  into `ApiError` with `toApiError(response)`. An axios error therefore only means no
  answer (`ApiUnreachableError`) or a cancel (`axios.isCancel`), which is rethrown
  untouched so TanStack can drop the query.
- `paramsSerializer` is `toSearch`: empty values dropped, arrays repeat the key.
  axios's default would send `status[]=`.
- Pass objects and `FormData` as `data` untouched; axios sets the JSON content type
  or the multipart boundary. Never set `Content-Type` by hand.
- The browser instance sends absolute URLs (`baseURL: window.location.origin`):
  the fetch adapter builds a `Request`, which needs one outside a browser.
- Every path ends in a slash; path segments are `encodeURIComponent`-escaped.
- Query values that are `undefined` or `""` are dropped; arrays repeat the key.
- `FormData` bodies are sent untouched (multipart); anything else is JSON.
- No retries beyond the single refresh-and-retry on a 401. In the browser, a query
  retries once for an unreachable API or a 5xx, never for an API code.

### Types

`lib/api/types.ts` mirrors [backend-api.md](integrations/backend-api.md) field for
field, **in the API's `snake_case`**. The admin is an editor over API resources: its
forms send the same names back (`brand_id`, `price_override`), so a rename layer
would be a mapping function per resource in each direction with nothing gained.
This is a deliberate departure from the storefront.

- `type` over `interface`.
- Nullable API fields are `T | null`.
- API responses are typed, not validated at runtime; the backend is first-party and
  a drift is a bug to fix in both repositories.
- No `any`. `as` only at the JSON boundary in `lib/api/client.ts` and where the API
  names fields exactly as the form does (`use-action-form.ts`).

---

## Forms

react-hook-form with `zodResolver`, rendered with shadcn `Field`:

```tsx
<RecordDialog schema={sizeSchema} defaultValues={...} action={(values) => saveSize(id, values)} ...>
  <NameSlugFields namePlaceholder="30 ml" />
  <NumberField name="sort_order" label="Sort order" />
</RecordDialog>
```

- **One zod schema per form, in `lib/<domain>/schemas.ts`**, used by the client form
  and re-run by the server action. A schema with a transform must accept its own
  output (the server parses what the client produced).
- Field components in `components/form/` bind a named field through
  `useFormContext`; invalid state is `data-invalid` on `Field` and `aria-invalid` on
  the control.
- `useActionForm` runs the action in `useMutation`, maps `details` onto fields, and
  puts everything else in a form-level `FormRootError`. It takes `invalidates`. `fieldForCode` sends a
  domain code to a field (`product_has_no_variants` → `is_published`).
- The submit button shows a `Spinner` and is disabled while pending. A failed submit
  never clears the form.
- Blank optional slugs are omitted from the request (`withoutBlankSlug`), so the API
  derives one.
- Number inputs store `valueAsNumber`; an empty box is `NaN` and fails the schema.

---

## Tables

The shadcn `data-table` pattern: `DataTable` with TanStack column definitions in a
client component, `manualFiltering`/`manualPagination`/`manualSorting`.

- Filters are `UrlSearch` and `UrlSelect`, which write search params through
  `useUrlParams` (`history.replaceState` in a transition) and drop `page`. The
  transition keeps the old rows on screen while the new key loads.
- A list page parses search params with a `parse*Filters` function and builds the
  API query with `to*Query`; both live in `lib/<domain>/query.ts` and are tested.
- `TablePagination` keeps real `href`s and `pushState`s an unmodified click.
- Every table has an `Empty` state that distinguishes "nothing yet" from "nothing
  matches".

---

## Mutations and feedback

- Mutations return `ActionResult<T>`: `{ ok: true, data }` or an `ActionFailure`
  (`code`, `message`, `fieldErrors`, `details`).
- In the browser: `useMutation({ mutationFn: async (v) => throwOnFailure(await
action(v)), meta: { invalidates: [...] } })`. `failureMessage(error)` gives the
  sentence to show, or `null` for Next's redirect signal.
- `meta.invalidates` comes from `lib/query/invalidation.ts` (`afterProductChange(id)`
  and friends), never an inline list, so every write's reach is in one place. A new
  query that an existing write affects gets added there. A mutation that returns the
  new record also writes it into its detail key.
- Optimistic updates only for values the API does not derive: `onMutate` cancels,
  snapshots and writes; `onError` restores and refetches.
- **`attempt()` (server actions) and `respond()` (Route Handlers) are the only
  `try`/`catch` around API calls.** Both rethrow anything that is not an API
  failure.
- Success is a `sonner` toast whose verb matches the button ("Create size" →
  "Size created").
- Destructive actions go through `ConfirmAction` (`alert-dialog`).

---

## Styling

Tailwind v4, theme in `app/globals.css` as shadcn variables for light and `.dark`.

- **No colour values in feature components.** A colour is a token (`--success`,
  `--warning`, `--info`, `--chart-1`…). The one exception is a shade swatch, whose
  colour is API data and is set with an inline `style`.
- `className` at a call site is for layout (grid, gap, width). Visual variants are
  added inside `components/ui/*` (the badge's status variants).
- Page, card and dialog titles use `font-heading` (Belleza); UI text is Noto Sans;
  the wordmark is the `wordmark` utility (bold, tracked, uppercase Noto Sans); SKUs
  and order numbers are `font-mono` (Noto Sans Mono). Belleza has no tabular figures,
  so a title that is a number (the KPI cards) sets `font-sans`. Figures are tabular
  everywhere else.
- Class lists are ordered by Prettier's Tailwind plugin. `components/ui/` is excluded
  from Prettier so shadcn updates diff cleanly.

---

## Formatting values

### Money

```ts
formatMoney("190350.00"); // "Rs 1,90,350.00"
```

Always two decimal places, Indian digit grouping. `toChartNumber` is the one
number conversion, for chart geometry. `MONEY_PATTERN` validates inputs.

### Dates

`lib/format/date.ts` formats with an explicit `Asia/Kathmandu` zone, so the server
and the browser agree. `daysAgo(n)` gives the Kathmandu calendar date for links.

---

## Errors

- Branch on `code` (see the table in [architecture.md](architecture.md#error-handling)).
- `describeError` turns a code into a sentence; `validation_error` messages pass
  through because they are written for users.
- An unknown code shows the request id.
- `console.error` only in `attempt()` and `respond()` (transport failure) and the
  error boundaries.

---

## Testing

Vitest + Testing Library for units and components; Playwright for three flows
against a live API.

```text
lib/format/money.test.ts            beside the module
components/products/VariantsEditor.test.tsx
proxy.test.ts
tests/fixtures/                     typed API fixtures and next/* mocks
tests/e2e/*.spec.ts                 Playwright
```

- Globals are off; import `describe`/`it`/`expect` from `vitest`.
- `server-only` is aliased to an empty module in `vitest.config.mts`.
- Mock `next/headers` and `next/navigation` with `tests/fixtures/next-server.ts`
  (cookie jar, redirect signal) or `tests/fixtures/router.ts` (router, search params).
- Mock server actions with `vi.mock("@/lib/<domain>/actions")` in component tests.
- Render anything that uses a query or mutation with `renderWithQuery`
  (`tests/fixtures/query.tsx`); seed data with `client.setQueryData(key, data)`.
  Assert invalidation with a spy on `client.invalidateQueries`.
- Stub `fetch` with `vi.stubGlobal`; build responses with `tests/fixtures/http.ts`.
  axios hands `fetch` one `Request`, so read what was sent with `sentRequest(fetchMock,
n)` (`.url`, `.method`, `.headers`, `await .json()`) or `sentPath`. An unstubbed
  `fetch` throws (`tests/setup.ts`), so no test reaches the network; a test whose
  mutation invalidates an active query stubs `fetch` for the refetch.
- Assert fields that matter and error codes, not whole objects or API messages.
- Playwright specs call `requireLiveApi()` and skip without `E2E_API`,
  `E2E_EMAIL` and `E2E_PASSWORD`. `E2E_API=1` is a switch; the dev server reads
  `API_BASE_URL` from `.env.local`.
- A spec names what it creates with a per-run prefix (`E2E Serum <timestamp>`) and
  deletes every row carrying it in `test.afterAll` (`tests/e2e/cleanup.ts`), from a
  fresh signed-in page, so a spec that fails midway still leaves the shared database
  as seeded.

---

## Formatting and linting

ESLint (`eslint-config-next` core-web-vitals + TypeScript) and Prettier with the
Tailwind plugin, print width 100.

- Absolute imports through `@/`, except `next.config.ts` (`./lib/env`).
- No default exports except where Next requires one.
- `no-console` allows only `console.error`.
- An `eslint-disable` names the rule and gives the reason on the same line.

---

## Type checking

`next typegen && tsc --noEmit` with `strict`, `noUncheckedIndexedAccess`,
`noImplicitOverride` and `noFallthroughCasesInSwitch`. `typegen` generates the
`PageProps`/`LayoutProps` route types.

---

## Other conventions

**Environment variables** are read in `lib/env.ts` only, validated with zod at
import. `NEXT_PUBLIC_*` is public; `API_BASE_URL` must never be.

**The brand name is `env.brandName`**, read on the server and passed as a prop.

**Metadata.** Every page exports `metadata`; the root sets the title template and
`noindex`.

**Copy** lives with its component, in sentence case, naming the action ("Mark as
shipped", "Unpublish instead").
