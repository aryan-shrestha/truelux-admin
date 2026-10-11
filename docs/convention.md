# Code Conventions

Last updated: 2026-10-11

This document records conventions that apply across the repository.

Prefer existing code examples over adding rules here. Only record conventions
that future contributors or agents need to know.

See [architecture.md](architecture.md) for layer responsibilities and system
constraints. This file covers how the code is written, not how it is arranged.

The examples for repositories, queries and schemas show the pattern every feature
follows. `src/features/auth/` is the first real slice (repository, query keys,
mutations, schemas, a form); the first list feature becomes the reference for lists
and replaces these examples with links.

---

## Naming

### Files

`kebab-case`, one concern per module, named for the concern. Role suffixes on the
files inside a feature, so a search for `.repository.ts` finds every API call:

```text
src/features/products/repositories/products.repository.ts
src/features/products/queries/products.queries.ts
src/features/products/queries/products.mutations.ts
src/features/products/schemas/product.schema.ts
src/features/products/components/products-table.tsx
src/features/products/components/product-form.tsx
src/features/products/hooks/use-product-filters.ts
src/features/products/index.ts
src/stores/ui.store.ts
```

Tests sit next to the file they test: `products.repository.test.ts`.

No `utils.ts`, `helpers.ts`, or `common.ts`. A module whose name does not say what is
inside becomes a dumping ground within a month. If a helper has no obvious home, it
usually belongs next to its only caller. (`src/lib/cn.ts` is shadcn's class-name
helper, renamed from the `utils.ts` shadcn generates; `components.json` points at it.)

### Components and types

`PascalCase`. Components are nouns for what they show: `ProductsTable`,
`ProductForm`, `OrderStatusBadge`. Pages are `<Name>Page` and are module-private to
their route file.

Types inferred from schemas share the schema's name without the suffix:

```ts
export const PRODUCT_SCHEMA = z.object({ ... });
export type Product = z.infer<typeof PRODUCT_SCHEMA>;
```

### Functions

Repository functions are verbs on the resource, matching the HTTP operation:

```ts
listProducts(params)        GET    admin/products/
getProduct(id)              GET    admin/products/{id}/
createProduct(input)        POST   admin/products/
updateProduct(id, input)    PATCH  admin/products/{id}/
deleteProduct(id)           DELETE admin/products/{id}/
transitionOrder(id, input)  POST   admin/orders/{id}/transition/
```

Hooks start with `use`. Predicates read as questions: `isPublished`, `hasStock`,
`canTransition`. `handle`, `process`, `manage` and `do` say nothing; name the actual
operation. Event-handler props are `on<Event>` and their implementations
`handle<Event>` only inside the component that owns them.

### Variables

`camelCase`. Collections are plural, single objects singular. Name the content, not
the container: `products`, not `productList`, `data` or `result`. Destructure
`data` from a query into a real name: `const { data: products } = useQuery(...)`.

Booleans read as assertions: `isLoading`, `hasItems`, `isSidebarOpen`. Avoid negated
names.

Module constants are `UPPER_SNAKE_CASE` and live at the top of the module that uses
them. A literal used twice becomes a constant; a literal used once stays inline.

---

## Features

A feature is named for the back-end resource it consumes, as a lowercase plural
noun: `products`, `orders`, `brands`. A collective noun is allowed when a feature
covers several small resources that no single plural describes (`taxonomy` for
categories, sizes, shades and skin types).

Create only the folders a feature uses. `index.ts` re-exports what routes and other
features need, and nothing else:

```ts
export { productQueries } from "./queries/products.queries";
export { ProductsTable } from "./components/products-table";
export type { Product } from "./schemas/product.schema";
```

Inside a feature, import siblings relatively (`../schemas/product.schema`). From
anywhere else, import the feature's index (`@/features/products`). ESLint rejects
`@/features/<name>/<anything>`.

---

## Repositories

Repository functions should:

- take one plain argument object or primitive, never a React value
- send the request through `httpClient` from `@/lib/repositories/client`
- parse every response with the feature's schema (`SCHEMA.parse(response.data)`)
- return the parsed value, typed by the schema
- let `ApiError` propagate; the client's interceptor already converted it

Repository functions should not:

- catch errors
- touch the query cache
- build user-facing messages
- know which screen called them

```ts
const PRODUCT_PAGE_SCHEMA = paginatedSchema(PRODUCT_SCHEMA);

export async function listProducts(params: ListParams): Promise<ProductPage> {
  const response = await httpClient.get("admin/products/", { params });
  return PRODUCT_PAGE_SCHEMA.parse(response.data);
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const response = await httpClient.patch(`admin/products/${id}/`, input);
  return PRODUCT_SCHEMA.parse(response.data);
}
```

Paths are relative to `{VITE_API_URL}/api/v1/` and **end with a slash**; Django
redirects a path without one, and the redirect turns a `POST` into a `GET`. Uploads
send `FormData`; every other write is JSON.

---

## Queries and mutations

One key factory and one `queryOptions` object per feature, so loaders and
components share the same key:

```ts
export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (params: ListParams) => [...productKeys.lists(), params] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};

export const productQueries = {
  list: (params: ListParams) =>
    queryOptions({ queryKey: productKeys.list(params), queryFn: () => listProducts(params) }),
  detail: (id: string) =>
    queryOptions({ queryKey: productKeys.detail(id), queryFn: () => getProduct(id) }),
};
```

Conventions:

- Never write a query key by hand outside the factory.
- Mutations live in `<feature>.mutations.ts` as hooks (`useUpdateProduct`) that
  invalidate by factory key on success: `queryClient.invalidateQueries({ queryKey:
productKeys.lists() })`.
- Optimistic updates only where rollback is trivial (a status toggle) and the feature
  document says so.
- `staleTime` and retries come from `src/app/query-client.ts`. Override per query
  only with a reason in the feature document.
- `ApiError` is registered as Query's default error type, so `error` is already
  typed.

---

## Schemas

- Response schemas mirror the API's field names exactly, `snake_case` included. Do
  not rename fields in a transform; a second naming scheme doubles every lookup.
- Money arrives as a decimal string (`"1250.00"`) and stays a string; never
  `Number()` or `parseFloat` it (see Other conventions).
- Dates arrive as ISO-8601 strings; parse with `z.iso.datetime()` and format for
  display.
- Use `z.object` (strip unknown keys), not `z.strictObject`, for responses: a field
  the API adds must not break the admin.
- Form schemas are separate from response schemas when the shapes differ (string
  inputs, optional fields), and are named `<Name>FormSchema` / `<Name>FormValues`.

---

## Forms

React Hook Form with `zodResolver(<FORM_SCHEMA>)` and shadcn's `Field` components.
Field components bound by `name` live in `src/components/form/` (`TextField`,
`TextareaField`, `SwitchField`). The references are
`src/features/taxonomy/components/taxonomy-form-dialog.tsx` (a form in a dialog) and
`src/features/products/components/product-form.tsx` (a page form).

- Submit through a mutation. On failure call `showApiError(form, error, messages)`
  from `src/components/form/show-api-error.ts`: a `validation_error`'s
  `fieldErrors` go under the fields the form has, the rest and every other code
  become one form alert (`root`), with `messages` overriding a code's sentence where
  the screen knows more. A domain error that belongs to one field (publishing
  without variants) is set on that field before calling it.
- A form in a dialog mounts only while the dialog is open, so it always starts from
  the current values.
- Disable the submit button while the mutation is pending; never block on a
  timer.
- Default values come from the query data, never from a store.

---

## Tables and lists

`DataTable` in `src/components/data-table/` renders one server page. The list
route owns the state. Orders is the reference: `src/routes/_dashboard/orders/index.tsx`
and `src/features/orders/components/orders-list.tsx`.

- page, sort and filters are search params validated by the route's Zod schema
  (`ORDER_FILTERS_SCHEMA`); every field `.catch()`es, so a hand-edited URL never
  breaks the page, and repeated values are normalised so equal filters make one key
- the page is a 1-based `page` param; `DataTable`'s pager is real links that set it,
  so middle-click and the back button work
- a filter change goes through the route's `navigate({ search, replace: true })` and
  drops `page`
- the list's `queryOptions` has `placeholderData: keepPreviousData`; pass
  `isPlaceholderData` (rows dim) and `isPending` (skeleton rows, first load only)
- `toListParams({ pagination, sorting })` from `@/lib/repositories/pagination`
  turns table state into the API's `limit`, `offset` and `ordering`
- `rowCount` is the API's `count`
- column definitions live in the feature (`orders-table.tsx`)
- the empty state is `EmptyState` from `src/components/feedback/`, with a filtered
  and an unfiltered message
- search is `SearchInput` from `src/components/data-table/`, writing `?q=` after a
  300 ms pause
- a list the API returns whole (taxonomy) passes no `pagination`, so `DataTable`
  renders no pager, and its search filters the cached array with the query's
  `select`

---

## Routes

- File routes under `src/routes/`; `_auth` and `_dashboard` are pathless layouts.
- A route file exports `Route` and a module-private page component. Nothing else.
- `validateSearch` with a Zod schema for every search param the page reads.
- `loader` prefetches with `context.queryClient.ensureQueryData(...)`; the component
  reads with `useSuspenseQuery` or `useQuery` on the same `queryOptions`. A detail
  route awaits it and turns `not_found` into `notFound()`. A **list** route starts it
  without awaiting (`void ...`), so a filter change never blocks the navigation or
  swaps the page for the pending skeleton, and reads with `useQuery`.
- `src/routeTree.gen.ts` is generated by the router plugin on `yarn dev`, `yarn
build` and `yarn test`. It is committed, so `yarn typecheck` works on a clean
  checkout. Never edit it.

---

## Stores

- One store per concern, in `src/stores/<concern>.store.ts`.
- Select single values (`useUiStore((state) => state.isSidebarOpen)`), never the
  whole store, so a component re-renders only for what it reads.
- `persist` only for preferences, under a `truelux-admin-` key.
- Before adding a store, check that the value is neither server data nor URL state.

---

## Errors

- Raise, never return. A repository throws `ApiError`; it never returns `null` for
  failure.
- Branch on `error.code`, never on `error.message` or `error.status` alone.
- Show the API's `message` to staff; it is written for humans. Show `requestId` on
  unexpected failures.
- `try`/`catch` only to translate an error into something specific (form field
  errors). Never swallow one.

The `ApiError` codes and status table are in
[architecture.md](architecture.md#error-handling). Do not duplicate them.

---

## Testing

Vitest with Testing Library and MSW, in jsdom (`src/**/*.test.ts(x)`). In tests the
page and the API share the origin `http://admin.test` (`vitest.config.ts`), so
jsdom sends no CORS preflight; handlers match `*/api/v1/...`.
`src/test/render-app.tsx` renders the whole app at a path; `src/test/staff.ts` holds
the signed-in staff user and its `me` handler. A test that needs a session calls
`saveSession(...)` and clears `localStorage` afterwards.

### Network

MSW intercepts real requests: tests register handlers with `server.use(...)` from
`@/test/msw-server`. There are no shared default handlers, and an unhandled request
fails the test (`onUnhandledFrame: "error"`). Never mock a repository, a query hook
or `httpClient` with `vi.mock`; doing so tests the mock.

Handler responses use the shapes in
[integrations/truelux-api.md](integrations/truelux-api.md), and error responses use
the full envelope.

### Components

- Query by role and accessible name first (`getByRole("button", { name: "Save" })`),
  text second, test ids never.
- `userEvent`, not `fireEvent`.
- Render with the real providers when the component needs the router or Query;
  `src/app/router.test.tsx` shows rendering a route at a path with
  `createMemoryHistory`.

### Assertions

- Assert what the user sees and what was sent, not internal state.
- Assert the error `code`, not the message.
- Three blank-line-separated blocks per test: arrange, act, assert. Do not label them
  with comments; the shape is the label.
- Test names state the condition and the expectation:
  `"shows the API's message under the email field when validation fails"`.

### End to end

Playwright specs in `e2e/`, one file per flow. They run against `yarn dev` and need
the API running for anything past the shell.

---

## Formatting and linting

Prettier is authoritative and its output is never hand-adjusted: double quotes,
semicolons, line length 100, Tailwind classes sorted by `prettier-plugin-tailwindcss`.
`src/components/ui/` and `src/hooks/use-mobile.ts` are shadcn output and are excluded
from both Prettier and ESLint, so a re-generated component diffs cleanly.

Repository-specific rules beyond the tooling config:

- **`@/` imports** for anything outside the current feature; relative imports only
  within a feature or a sibling folder.
- Import order: packages, a blank line, `@/` imports, a blank line, relative imports.
- `import type` for type-only imports (`verbatimModuleSyntax` requires it).
- No default exports, except where a tool requires one (config files).
- An `eslint-disable` names the rule and gives the reason after `--`:
  `// eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table ...`.
  A bare disable is rejected in review.

---

## Type checking

`tsc -b` over two projects: `tsconfig.app.json` (`src/`) and `tsconfig.node.json`
(tool configs and `e2e/`). Both are `strict`; the app adds `noUncheckedIndexedAccess`.

- Types come from Zod schemas via `z.infer`. A hand-written interface for an API
  shape is a second source of truth.
- `unknown`, then narrow. `any` is rejected in review.
- `as` only where the type system cannot see a guarantee, with the reason obvious
  from the line or stated in a comment.
- Non-null assertions (`!`) are not used; handle the `undefined`.

---

## Comments

The default is no comment (see `CLAUDE.md`). The exceptions:

- **A non-obvious constraint**: why the proxy resolves the URL before the
  allow-list check, why the router plugin must come before the React plugin.
- **Security reasons**: why the tokens go only through `session.ts`.
- **`eslint-disable`** carries a rule name and a reason.

Everything else — narrating a line, restating a type, sectioning a file with banner
comments — is removed in review.

---

## Other conventions

**Environment.** The SPA reads every variable through `env` in `src/lib/env.ts` and
nowhere else. Every variable is required, has no default (ADR 0004) and is a
`VITE_*` variable, so none may be a secret.

**Money** is a decimal string from the API (`"125000.00"`) and stays a string to the
pixel. `formatMoney` in `src/lib/money.ts` displays it as `Rs 1,25,000.00`, grouped
from the string's digits without ever becoming a float. Form inputs validate amounts
as decimal strings (`^\d+(\.\d{1,2})?$`) and send strings. The admin does no
arithmetic on money.

**Time.** The API sends UTC ISO-8601 strings. `src/lib/date.ts` formats them in the
browser's time zone with `Intl.DateTimeFormat` (`formatDateTime`), and reads and
writes calendar days for date filters as local dates (`parseIsoDate`, `toIsoDate`,
`formatDay`) so a day never shifts through UTC midnight. A link that must match the
API's day buckets (the dashboard's) uses `shopDaysAgo`, which counts
`Asia/Kathmandu` days.

**Side effects.** `package.json` declares `"sideEffects": ["*.css"]` so Rollup can drop
what a feature barrel re-exports but a route loader does not use. Never rely on a
side-effect-only import of a `.ts` module; it would be dropped from the build.

**Icons.** Lucide, imported by name with the `Icon` suffix
(`LayoutDashboardIcon`), so the import says what it is.
