# App shell

Status: Implemented

Last updated: 2026-10-11

---

## Goal

Give every signed-in screen a consistent frame: navigation, page header, feedback
and error handling.

---

## Scope

What is included in this implementation?

- shadcn `sidebar` layout with the TrueLux wordmark and two navigation groups —
  **Shop**: Dashboard, Orders; **Catalogue**: Products, Brands, Categories, Shades,
  Sizes, Skin types — plus **Settings**: Shipping. It collapses to an icon rail on
  desktop and a `sheet` on mobile. Each entry is added by the feature that adds its
  route.
- A user menu in the sidebar footer: the staff email, a Light/Dark/System choice and
  **Sign out**
- A page header with a `breadcrumb`, the title, **Refresh data**
  ([tanstack-query.md](tanstack-query.md)) and a primary-action slot
- `sonner` toasts for mutation results
- Loading skeletons, a route error page and a not-found page
- Theme: the storefront's palette, type and shape as shadcn variables, with status
  hues (`success`, `warning`, `info`) and a denser, neutral admin feel; light and dark
- One map from order status to label and badge variant, so status colours are
  consistent everywhere

What is explicitly outside the scope?

- Multiple languages, and role-based navigation

---

## Context

- Requirements ported from `../admin/docs/features/app-shell.md` (Implemented there).
  Its theme token table, fonts (Noto Sans, Belleza, Noto Sans Mono) and measured
  contrast values are the reference for the theme work.
- The shell itself came with [scaffold.md](scaffold.md); this document tracks what
  is still to build on it.
- The user menu and sign-out come from [staff-auth.md](staff-auth.md).

---

## Planned

None. Every navigation entry is in place, each added with its route (`Link`'s `to`
is type-checked against the route tree). `ConfirmDialog` (on `alert-dialog`; the
caller owns `open` and the mutation, and closes it on success) and `EmptyState` (on
shadcn `empty`) live in `src/components/feedback/`, built with
[orders.md](orders.md).

---

## Implemented

- `src/routes/_dashboard.tsx` — `SidebarProvider` + `AppSidebar` + `SidebarInset`
  with `Topbar`; the sidebar's open state comes from `ui.store`; `UserMenu` from
  `@/features/auth` is passed as the sidebar's `footer`, because shared layout code
  may not import a feature (ADR 0003).
- `src/config/navigation.ts` — `NAVIGATION` as groups (`{ label, items }`); today
  **Shop → Dashboard, Orders**, **Catalogue → Products, Brands, Categories, Shades,
  Sizes, Skin types** and **Settings → Shipping**.
- `src/components/layout/app-sidebar.tsx` — `collapsible="icon"`, a "TL" tile and
  "TrueLux Admin" as the brand, a `SidebarGroupLabel` per group inside a
  `navigation` landmark named "Main", `aria-current="page"` and tooltips on the
  active item, the `footer` slot, and the mobile `sheet` closing when a link is
  followed.
- `src/components/ui/sidebar.tsx` — the mobile sheet's title ("Navigation") and
  description are real copy.
- `src/features/auth/components/user-menu.tsx` — `dropdown-menu` in the
  `SidebarFooter`: initials, name and email from `authQueries.me()`, a
  Light/Dark/System radio group bound to `ui.store`'s `theme`, and **Sign out**.
  It replaced the top bar's two-state theme toggle.
- `src/components/layout/topbar.tsx` — the sidebar trigger.
- `src/components/layout/page-header.tsx` — a `breadcrumb` from `crumbs`, the title
  (heading face), description, **Refresh data**
  ([tanstack-query.md](tanstack-query.md)) and the `actions` slot.
- `src/components/feedback/page-skeleton.tsx` — skeletons shaped like a page header,
  a KPI row and a table, in an `aria-busy` wrapper with a `role="status"` "Loading"
  label; the router's `defaultPendingComponent`.
- `src/components/feedback/route-error.tsx`, `not-found.tsx` — the root
  `errorComponent` (message, request id, retry) and `notFoundComponent`.
- `src/app/providers.tsx` — `Toaster` and `TooltipProvider` mounted.
- `src/styles/globals.css` — the storefront's tokens for light and `.dark`, ported
  from `../admin/app/globals.css` (its token table and measured contrast values in
  `../admin/docs/features/app-shell.md` apply unchanged), plus `--success`,
  `--warning`, `--info`, the radius scale (2px controls, 0.375rem cards) and tabular
  figures on `body`. Fonts from Fontsource: Noto Sans (UI), Belleza (headings), Noto
  Sans Mono.
- `src/components/ui/badge.tsx` — square badges; `success`, `warning`, `info` and
  `destructive` are a 10% tint of the hue with a 30% border and text in the hue;
  `secondary` has an `--input` border.
- `src/features/orders/` — `schemas/order-status.schema.ts` (the API's five
  statuses), `order-status.ts` (status → label and badge variant) and
  `OrderStatusBadge`, the only status renderer, exported for the dashboard and the
  orders screens.
- `src/stores/ui.store.ts`, `src/lib/theme.ts` — persisted theme preference
  (`light`, `dark`, `system`) applied to `<html>` before the first render.

---

## Remaining

None.

---

## Decisions

### Decision: status colours are badge variants

**Decision**

Order status colours are the `warning`, `info`, `secondary`, `success` and
`destructive` badge variants, mapped once in the orders feature.

**Reason**

Carried over from `../admin`: a variant keeps the colour in the theme, not at the
call site.

**Consequence**

Every status is shown through `OrderStatusBadge`, which always carries the status
name, so colour is never the only signal.

---

## Gotchas

- The storefront's tokens are copied, not imported; the apps are separate
  repositories. A storefront palette change needs the same change here.
- shadcn's sidebar writes its own `sidebar_state` cookie; this app ignores it (see
  [scaffold.md](scaffold.md#gotchas)).
- Re-adding shadcn's `sonner` restores a `next-themes` import (see
  [scaffold.md](scaffold.md#decisions)).
- shadcn's `BreadcrumbPage` renders `role="link"` with `aria-current="page"`, so a
  test looking for the sidebar's current link must scope to the "Main" navigation.
- `badge.tsx` and `sidebar.tsx` carry local edits; re-adding them with the shadcn CLI
  drops the status variants and the sheet copy.

---

## API

```text
GET /api/v1/auth/me/    the user menu (staff-auth)
```

---

## Data changes

- `localStorage["truelux-admin-ui"]` — `isSidebarOpen`, `theme` (exists).

---

## Permissions

None beyond staff-auth's guard.

---

## Tests

- `src/app/router.test.tsx` — the dashboard renders in the shell with its link
  marked current in the "Main" navigation; an unknown path renders not-found.
- `src/features/auth/components/user-menu.test.tsx` — the menu shows the staff
  email; choosing Dark sets the theme; Sign out lands on `/login`.
- `src/components/layout/refresh-button.test.tsx` — **Refresh data**.
- `src/components/feedback/page-skeleton.test.tsx` — the skeleton announces a load.
- `src/features/orders/components/order-status-badge.test.tsx` — each status shows
  its label; every status has its own variant.
- `e2e/shell.spec.ts` — the app in a real browser.

---

## Files

```text
src/routes/_dashboard.tsx
src/components/layout/
src/components/feedback/
src/components/ui/badge.tsx
src/components/ui/sidebar.tsx
src/config/navigation.ts
src/features/auth/components/user-menu.tsx
src/features/orders/
src/stores/ui.store.ts
src/lib/theme.ts
src/styles/globals.css
```

---

## Future context

None.
