# Scaffold

Status: Implemented

Last updated: 2026-10-11

---

## Goal

Give admin v2 a working, verified skeleton — tooling, the app shell, shared
infrastructure and documentation — so that feature work starts from agreed
patterns rather than inventing them per screen.

---

## Scope

What is included in this implementation?

- Vite + React + TypeScript project on Yarn 4 (`node-modules` linker)
- Tailwind v4, shadcn/ui (radix-nova, neutral) with the components the shell and the
  first features need
- TanStack Router (file-based, auto code splitting), TanStack Query, TanStack Table v8
- The app shell: sidebar layout (`_dashboard`), centred layout (`_auth`),
  placeholder dashboard and sign-in pages, not-found and route-error pages
- Light/dark theme and sidebar state, persisted in a Zustand UI store
- Shared infrastructure: the HTTP client, `ApiError`, limit/offset pagination
  helpers, a server-paginated `DataTable`
- ESLint with the import-boundary rules (ADR 0003), Prettier, strict TypeScript
- Vitest (`web` and `bff` projects) with MSW; Playwright smoke tests
- The BFF's health route and proxy ([bff.md](bff.md))
- Documentation mirroring `../back-end`

What is explicitly outside the scope?

- Staff sign-in, sign-out and the route guard (staff-auth)
- Every business screen
- Deployment

---

## Context

The API is `../back-end`; its contract for the admin is
`back-end/docs/features/admin-api.md` and `staff-auth.md`, summarised in
[../integrations/truelux-api.md](../integrations/truelux-api.md). `../admin` is the
Next.js admin this app replaces; its `docs/` and `lib/format/money.ts` hold
decisions worth porting (money as a decimal string).

---

## Planned

- Everything in Scope.

---

## Implemented

- `package.json`, `.yarnrc.yml` — Yarn 4.12, `node-modules` linker; scripts `dev`,
  `build`, `typecheck`, `lint`, `format`, `test`, `e2e`.
- `vite.config.ts` — router plugin (before React), React, Tailwind, `@` alias, dev
  server on 5173 with `/bff` proxied to 8787.
- `tsconfig.app.json`, `tsconfig.server.json`, `tsconfig.node.json` — three strict
  projects built by `tsc -b`.
- `eslint.config.js` — recommended TypeScript, React Hooks, React Refresh, TanStack
  Query and Router rules, plus the `no-restricted-imports` boundaries of ADR 0003.
- `prettier.config.mjs` — width 100, Tailwind class sorting against
  `src/styles/globals.css`.
- `components.json`, `src/components/ui/*` — shadcn: alert-dialog, avatar, badge,
  button, card, dialog, dropdown-menu, field, input, label, separator, sheet,
  sidebar, skeleton, sonner, table, tooltip. `src/hooks/use-mobile.ts` comes with the
  sidebar.
- `src/main.tsx`, `src/app/providers.tsx` — Query, tooltip and router providers,
  Sonner toaster, Query devtools in development.
- `src/app/router.ts` — `createAppRouter({ queryClient, history? })`, context
  `{ queryClient }`, preload on intent, `defaultPreloadStaleTime: 0`.
- `src/app/query-client.ts` — `staleTime` 30 s; retries only network errors and
  5xx, at most twice; `ApiError` registered as Query's default error type.
- `src/routes/__root.tsx`, `_auth.tsx`, `_auth/login.tsx`, `_dashboard.tsx`,
  `_dashboard/index.tsx` — the shell and placeholder pages. `src/routeTree.gen.ts`
  is generated and committed.
- `src/components/layout/` — `AppSidebar` (driven by `src/config/navigation.ts`),
  `Topbar`, `PageHeader`, `ThemeToggle`.
- `src/components/feedback/` — `RouteError` (shows the request id of an `ApiError`)
  and `NotFound`.
- `src/components/data-table/data-table.tsx` — `DataTable` for one server page:
  manual pagination and sorting, skeleton rows while loading, an empty message.
- `src/lib/repositories/` — `client.ts`, `errors.ts`
  ([api-error-contract.md](api-error-contract.md)) and `pagination.ts`
  (`paginatedSchema`, `toListParams`, page size capped at the API's 100).
- `src/stores/ui.store.ts`, `src/lib/theme.ts` — persisted sidebar and theme
  preference; the theme is applied to `<html>` before the first render.
- `src/test/setup.ts`, `src/test/msw-server.ts` — jest-dom, MSW with unhandled
  requests as errors, `matchMedia` and `scrollTo` stubs for jsdom.
- `playwright.config.ts`, `e2e/shell.spec.ts` — runs against `yarn dev`.
- `src/features/` — empty; the first feature defines the reference slice.

---

## Remaining

- Staff sign-in, sign-out, session refresh, and the `_dashboard` route guard: the
  staff-auth feature. Until then every API call through the proxy returns 401.
- Deployment: choose the host for the SPA and the BFF (one Node service serving
  `dist/` and `server/app.ts`, or static hosting plus a function), set security
  headers (CSP, `frame-ancestors 'none'`, `Referrer-Policy`), and wire CI.
- `EmptyState`, `ConfirmDialog` and a money formatter were left out until a feature
  needs them; the convention for each is in [../convention.md](../convention.md).
- Vendor chunking: the main bundle is about 530 kB (170 kB gzipped) and Vite warns
  on every build. Not addressed because nothing is slow yet.
- `git init` and the first commit: not done, at the owner's request.

---

## Decisions

### Decision: next-themes was removed in favour of the UI store

**Decision**

shadcn's `sonner` component pulls in `next-themes`. It was removed: the theme
preference lives in `src/stores/ui.store.ts`, `src/lib/theme.ts` applies it, and
`src/components/ui/sonner.tsx` reads the store.

**Reason**

`next-themes` renders an inline `<script>` meant for server rendering. In a
client-rendered React 19 app the script never runs and React logs an error on every
load.

**Consequence**

Re-adding `sonner` with the shadcn CLI restores the `next-themes` import; re-apply
the two-line change in `sonner.tsx`.

### Decision: TanStack Table stays on v8

**Decision**

`@tanstack/react-table` is pinned to `^8`.

**Reason**

v9 changed the table API; v8 is what `../admin` uses and what shadcn's data-table
examples target.

**Consequence**

Upgrade deliberately, with `DataTable` and its tests, not as a side effect.

### Decision: Playwright is pinned to 1.63

**Decision**

`@playwright/test` is `~1.63.0`, the version `../admin` uses.

**Reason**

Both projects share the browsers cached in `~/Library/Caches/ms-playwright`; a newer
Playwright needs a new browser download.

**Consequence**

Upgrading Playwright needs `yarn playwright install chromium`.

---

## Gotchas

- `src/routeTree.gen.ts` is regenerated by the router plugin whenever Vite runs
  (`dev`, `build`, `test`). A new route file needs one of those before `yarn
typecheck` sees it.
- The router plugin must stay before the React plugin in `vite.config.ts`.
- shadcn's sidebar writes its own `sidebar_state` cookie as well. It is ignored: the
  open state comes from the Zustand store, passed as `open`/`onOpenChange`.
- `src/lib/cn.ts` replaces shadcn's `src/lib/utils.ts`; `components.json` points the
  `utils` alias at it, so new components import the right file.
- jsdom has no `matchMedia` or `scrollTo`; `src/test/setup.ts` stubs both.
- MSW 3 renamed `onUnhandledRequest` to `onUnhandledFrame`.

---

## API

None. See [bff.md](bff.md) for the routes the BFF serves.

---

## Data changes

- `localStorage["truelux-admin-ui"]` — `{ isSidebarOpen, theme }`, persisted by
  Zustand.

---

## Permissions

None yet. The shell renders without a session until staff-auth adds the guard.

---

## Tests

- `src/app/router.test.tsx` — the dashboard renders in the sidebar shell with its
  link marked current; `/login` renders without the sidebar; an unknown path renders
  the not-found page.
- `src/components/data-table/data-table.test.tsx` — rows, the empty message, and the
  next-page request computed from the API's row count.
- `src/lib/repositories/pagination.test.ts` — limit/offset, the 100 cap, DRF
  ordering.
- `e2e/shell.spec.ts` — the shell in a real browser; `/bff/health` through the Vite
  proxy.

Verified on 2026-10-11: `yarn lint`, `yarn typecheck`, `yarn test` (23 tests),
`yarn build`, `yarn e2e` (2 tests) all pass. Checked by hand in a browser with the
back-end running: no console errors; theme and sidebar state survive a reload.

---

## Files

```text
package.json  vite.config.ts  vitest.config.ts  playwright.config.ts
eslint.config.js  prettier.config.mjs  components.json  tsconfig*.json
src/
├── main.tsx
├── app/
├── routes/
├── components/{layout,feedback,data-table,ui}/
├── lib/{repositories,theme.ts,cn.ts}
├── stores/ui.store.ts
├── config/navigation.ts
└── test/
e2e/shell.spec.ts
```

---

## Future context

The first business feature should be built as the reference slice
(repositories → queries → schemas → components → route) and
[../convention.md](../convention.md)'s examples replaced with links to it.
