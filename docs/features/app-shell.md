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
- A page header with the title, **Refresh data**
  ([tanstack-query.md](tanstack-query.md)) and a primary-action slot; the page's
  `breadcrumb` sits at the right of the top bar
- `sonner` toasts for mutation results
- Loading skeletons, a route error page and a not-found page
- Theme: the TrueLux logo's deep green and gold as shadcn variables, with status hues
  (`success`, `warning`, `info`); light and dark. The logo itself in the sidebar, on
  sign-in, on the Authenticating screen and as the favicon
- One map from order status to label and badge variant, so status colours are
  consistent everywhere

What is explicitly outside the scope?

- Multiple languages, and role-based navigation

---

## Context

- Requirements ported from `../admin/docs/features/app-shell.md` (Implemented there),
  including its fonts and radius scale. The colours follow the logo instead, and the
  type, radius and spacing were since loosened (see Decisions).
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
  with `Topbar`; from `md` up the frame is the window's height (`md:h-svh`) and never
  scrolls; the sidebar's open state comes from `ui.store`; `UserMenu` from
  `@/features/auth` is passed as the sidebar's `footer`, because shared layout code
  may not import a feature (ADR 0003).
- `src/config/navigation.ts` — `NAVIGATION` as groups (`{ label, items }`); today
  **Shop → Dashboard, Orders**, **Catalogue → Products, Brands, Categories, Shades,
  Sizes, Skin types** and **Settings → Shipping**.
- `src/components/layout/app-sidebar.tsx` — `collapsible="icon"`, the logo
  (`brand-logo.tsx`, `public/truelux-logo.jpg`) and "TrueLux Admin" as the brand, a `SidebarGroupLabel` per group inside a
  `navigation` landmark named "Main", `aria-current="page"` and tooltips on the
  active item, the `footer` slot, and the mobile `sheet` closing when a link is
  followed.
- `src/components/ui/sidebar.tsx` — the mobile sheet's title ("Navigation") and
  description are real copy.
- `src/features/auth/components/user-menu.tsx` — `dropdown-menu` in the
  `SidebarFooter`: initials, name and email from `authQueries.me()`, a
  Light/Dark/System radio group bound to `ui.store`'s `theme`, and **Sign out**.
  It replaced the top bar's two-state theme toggle.
- `src/components/layout/topbar.tsx` — the sidebar trigger and, on the right, an
  empty slot for the page's breadcrumb. `Topbar` wraps the `Outlet` so it can share
  the slot through context; `TopbarBreadcrumb` portals its children into it.
- `src/components/layout/page.tsx` — `Page`, every signed-in page's root: it fills
  the frame under the top bar, and its table body or form section scrolls rather
  than the page; the dashboard alone scrolls whole (`isScrollable`). The rules are in
  [../convention.md](../convention.md#page-layout-and-scrolling).
- `src/components/layout/page-header.tsx` — a `breadcrumb` from `crumbs`, rendered
  into the top bar through `TopbarBreadcrumb`, then the title
  (semibold), description, **Refresh data**
  ([tanstack-query.md](tanstack-query.md)) and the `actions` slot, right of Refresh.
  `leadingActions` sit left of Refresh; only the product page's **Publish** uses
  it, at the owner's request (2026-10-12): every other action stays on the right.
- `src/components/feedback/page-skeleton.tsx` — skeletons shaped like a page header,
  a KPI row and a table, in an `aria-busy` wrapper with a `role="status"` "Loading"
  label; the router's `defaultPendingComponent`. A route whose layout differs sets its
  own `pendingComponent` (the dashboard does).
- `src/components/feedback/authenticating-screen.tsx` — a full-page screen on the
  muted background: the TL tile and "TrueLux Admin" wordmark, "Authenticating…"
  (`role="status"`), and an indeterminate bar (`animate-indeterminate`, defined in
  `globals.css`, moving only under `motion-safe`). It is the `_dashboard` layout's
  `pendingComponent`, shown at once (`pendingMs: 0`, the default 500 ms minimum
  against a flash) only while a first load, a reload or a fresh sign-in checks the
  session. Token refreshes later on show nothing ([staff-auth.md](staff-auth.md)).
- `src/components/feedback/route-error.tsx`, `not-found.tsx` — the root
  `errorComponent` (message, request id, retry) and `notFoundComponent`.
- `src/app/providers.tsx` — `Toaster` and `TooltipProvider` mounted.
- `src/styles/globals.css` — tokens from the logo (see [Theme tokens](#theme-tokens)),
  `--success`, `--warning`, `--info`, the radius scale (from `--radius` 6px: 6px controls, 10px cards, dialogs and sheets),
  tabular figures on `body`, the `animate-indeterminate` keyframes, and themed
  scrollbars: thin, on a transparent track, the thumb `--primary` mixed at 50% (70% on
  hover), so green in light and gold in dark, at least 3:1 against every surface.
  Chrome and Firefox read `scrollbar-color` / `scrollbar-width`; Safari reads the
  `::-webkit-scrollbar` rules. Fonts from
  Fontsource: Instrument Sans (UI and headings: `--font-heading` is `--font-sans`)
  and Noto Sans Mono (SKUs, slugs, codes).
- `src/components/layout/brand-logo.tsx` — `BrandLogo`, the logo as a decorative image
  (the name is always written beside it): the sidebar header, the sign-in card and
  the Authenticating screen. `index.html` uses the logo as the favicon (Vite's
  `favicon.svg` is gone).

### Theme tokens

From the logo: its green, deepened to a quiet near-black emerald (`#0F2622`), and its
gold, brightened so it shines on that green (`#E8C26A`; the logo's own are `#12302B`
and `#D5B97C`).

| Token                                 | Light                           | Dark                            | Role                               |
| ------------------------------------- | ------------------------------- | ------------------------------- | ---------------------------------- |
| `--background`                        | `#FAF7F0` ivory                 | `#0A1412`                       | Page                               |
| `--foreground`                        | `#14231F`                       | `#ECE6D8`                       | Text                               |
| `--card`, `--popover`                 | `#FFFFFF`                       | `#0F1D1A`                       | Cards, menus, dialogs              |
| `--primary` / `--primary-foreground`  | `#0F2622` / `#F2D58E` gold      | `#E8C26A` / `#0E2420`           | Primary buttons                    |
| `--secondary`, `--accent`             | `#EFE6D3` gold cream            | `#182C27`, `#1C332D`            | Secondary buttons, hovers, Shipped |
| `--muted` / `--muted-foreground`      | `#F2EDE2` / `#5C625B`           | `#13231F` / `#A9B0A6`           | Table heads / secondary text       |
| `--border` / `--input`                | `#E3DACA` / `#8C887A`           | `#243630` / `#6A7B73`           | Hairlines / control borders        |
| `--ring`                              | `#A07E2A` gold                  | `#E8C26A`                       | Focus                              |
| `--destructive`                       | `#A3392F`                       | `#E58A7E`                       | Cancelled, destructive actions     |
| `--success`, `--warning`, `--info`    | `#2E6A47`, `#86591A`, `#315B80` | `#8FC6A2`, `#DDB06A`, `#9DB8D4` | Delivered, Pending, Confirmed      |
| `--chart-1`…`5`                       | green, gold, sage, clay, slate  | gold, mint, sky, clay, lilac    | Charts                             |
| `--sidebar` / `--sidebar-foreground`  | `#0E2420` / `#EFE7D4`           | `#08110F` / `#E7E0D0`           | A green sidebar in both modes      |
| `--sidebar-accent` / `-foreground`    | `#183931` / `#F7D98F`           | `#142821` / `#F7D98F`           | Hovered and active nav item        |
| `--sidebar-primary`, `--sidebar-ring` | `#E8C26A`                       | `#E8C26A`                       | Gold accents and focus             |

Measured contrast (WCAG): every text pair at least 4.5:1, in both modes: text on
page 15.2:1 (dark 15.1:1), secondary text on muted 5.4:1 (7.3:1), primary button
text 11.1:1 (9.6:1), sidebar text 13.2:1 (14.6:1) and its 70% group labels 7.1:1
(7.5:1), the active nav item 9.2:1 (11.3:1), gold on the sidebar 9.6:1, status text
on its 10% badge tint 5.3–6.2:1 (5.9–7.3:1). Control borders and focus rings at
least 3:1: input border on a card 3.6:1 (3.9:1), focus ring on the page 3.6:1
(11.0:1). Every chart colour at least 3.8:1 against a card.
---

## Remaining

- A keyboard path to row actions. They open only on right-click or long-press
  (see Decisions), which keyboard and screen-reader users cannot do. Not built
  because the owner asked for right-click only; raise it before relying on the admin
  for staff who do not use a mouse.

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

### Decision: the colours follow the logo, not the storefront

**Decision**

The theme's colours come from the TrueLux logo (`public/truelux-logo.jpg`): its green,
deepened, and its gold, brightened. They replace the storefront's charcoal and greige
tokens, which the admin had copied from `../admin`.

**Reason**

The owner asked for the admin to be themed after the logo (2026-10-12), then for a
darker, quieter green and a gold that stands out on it.

**Consequence**

The admin no longer mirrors `../front-end/app/globals.css`; a storefront palette
change does not need a change here. A new token must keep the contrast floors
above (4.5:1 text, 3:1 controls).

### One sans family, a graded radius and looser spacing

**Decision**

- Type: Instrument Sans for everything, headings in semibold with tight tracking. It
  replaced Noto Sans (UI) and Belleza (headings), the storefront's fonts.
- Radius: one `--radius` (0.375rem) with a scale around it: `lg` 6px for controls,
  `xl` 10px for cards, dialogs and sheets. It replaced 2px controls.
- Spacing: `Page` is `p-5 md:p-8` with `gap-8` between sections; card grids `gap-6`;
  cards pad 24px (`--card-spacing` 6; `size="sm"` 16px); default controls are 36px
  (`h-9`, small 32px); table rows have `py-3` cells under an `h-11` header; dialogs
  and sheets pad 24px; field groups `gap-6`. The top bar is `h-16` with the page's
  gutter.

**Reason**

The owner found the layout tight and the serif headings hard to read on a dashboard
(2026-10-12). Instrument Sans was picked over Hanken Grotesk, IBM Plex Sans and
Public Sans because it has tabular figures (`tnum`, which `body` turns on) for the
price and stock columns.

**Consequence**

- `button`, `input`, `input-group`, `select`, `command`, `tabs`, `card`, `table`,
  `dialog`, `alert-dialog`, `sheet` and `field` in `components/ui/` carry
  these sizes; re-adding one with the shadcn CLI brings back Nova's compact sizes.
- Table cells keep shadcn's 8px horizontal padding: wider cells push the products
  table (nine columns) past a 1440px window with the sidebar open.

### Every single choice is the Radix combobox

**Decision**

Every single choice (form fields and the product list's filters) is a searchable
combobox from `src/components/form/combobox.tsx`: shadcn's Radix recipe, `popover` +
`command`, a trigger button showing the choice (and a shade's swatch) and a search box
in the popover. `ComboboxField` binds it to a form. shadcn's `select` is no longer
used, and its Base UI `combobox` (and `@base-ui/react`) was removed.

**Reason**

The owner asked for a combobox on every select (2026-10-12). The Base UI combobox,
used by the product form until then, renders its list outside a Radix dialog or
sheet, which blocks pointer events there, so its options could not be clicked in
the variant sheet or a dialog. Radix popovers nest inside Radix modals.

**Consequence**

`components/ui/select.tsx` stays generated but unused. cmdk matches an option on
its `value`, so a `CommandItem`'s value is the label, not the id (whose hex digits
would match).

### Row actions only on right-click

**Decision**

A table row's actions (products, variants, the five catalogue kinds) open only from
shadcn's `context-menu` on right-clicking or long-pressing the row (`RowMenu`). The
⋯ `dropdown-menu` button and the actions column were removed.

**Reason**

The owner asked for it (2026-10-12): the right-click menu does the same job.

**Consequence**

Rows are not focusable, so a keyboard or screen-reader user cannot reach Publish,
Delete, Change stock and the rest (a product's Edit is still its name link), and
nothing on screen says the menu exists. Restoring a keyboard path (a focusable row
that opens the menu, or the ⋯ button) is listed under Remaining.

---

## Gotchas

- shadcn's sidebar writes its own `sidebar_state` cookie; this app ignores it (see
  [scaffold.md](scaffold.md#gotchas)).
- Re-adding shadcn's `sonner` restores a `next-themes` import (see
  [scaffold.md](scaffold.md#decisions)).
- The breadcrumb is portalled, so it is absent on a page's first render and appears
  once the top bar's slot has mounted; a `PageHeader` rendered outside `Topbar` shows
  no breadcrumb. The page skeletons have no breadcrumb placeholder.
- shadcn's `BreadcrumbPage` renders `role="link"` with `aria-current="page"`, so a
  test looking for the sidebar's current link must scope to the "Main" navigation.
- `SidebarInset` is `min-w-0`: as a flex item it otherwise grows to its widest child,
  so a wide table stretched the page sideways instead of scrolling in its container.
- `DialogContent` is a flex column capped at the window's height
  (`max-h-[calc(100svh-2rem)]`); only `DialogBody` (a local addition to `dialog.tsx`)
  scrolls, so the header and footer stay put. A form inside needs `flex min-h-0
flex-col gap-6`, or the body cannot shrink. `DialogBody` runs to the dialog's edges
  with 4px vertical padding so focus rings are not clipped.
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
  marked current in the "Main" navigation; the page's breadcrumb renders in the top
  bar, apart from the title; an unknown path renders not-found.
- `src/features/auth/components/user-menu.test.tsx` — the menu shows the staff
  email; choosing Dark sets the theme; Sign out lands on `/login`.
- `src/components/layout/refresh-button.test.tsx` — **Refresh data**.
- `src/components/feedback/page-skeleton.test.tsx` — the skeleton announces a load.
- `src/app/router.test.tsx` — a first load shows "Authenticating…" at once while the
  session is checked, then the dashboard; a token refresh during a later navigation
  never shows it.
- `src/features/orders/components/order-status-badge.test.tsx` — each status shows
  its label; every status has its own variant.
- `e2e/shell.spec.ts` — the app in a real browser.
- The scrolling layout is not covered by Vitest (jsdom does no layout). It was checked
  on 2026-10-12 in Chromium at 1440×800 against a production build with the API
  mocked: the window scrolls on no page; the dashboard scrolls as a page; orders,
  products, the taxonomy lists and the variants table scroll their body under a
  sticky header row; the product and new-product forms scroll their fields with Save
  in view.

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
