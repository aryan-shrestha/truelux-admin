# App shell

Status: Implemented

Last updated: 2026-09-28

---

## Goal

Give every signed-in screen a consistent frame: navigation, page header, feedback
and error handling.

---

## Scope

What is included in this implementation?

- shadcn `sidebar` layout: TrueLux wordmark; nav items Dashboard, Orders, Products,
  Brands, Categories, Shades, Sizes, Skin types; the signed-in user's email and **Sign out** in
  the footer (`dropdown-menu`). The sidebar collapses to an icon rail on desktop and
  to a `sheet` on mobile.
- Page header with a `breadcrumb` and a primary action slot
- `sonner` toasts for mutation results; `alert-dialog` for destructive confirms
- `loading.tsx` with `skeleton`s, `error.tsx`, `not-found.tsx`
- Theme: shadcn variables in `app/globals.css` sharing the storefront's palette,
  type and shape ([ADR 0004](../decisions/0004-the-admin-shares-the-storefront-theme.md)),
  with a denser, neutral admin feel. Light and dark via `next-themes`, with a toggle
  in the user menu.
- `lib/api/errors.ts`: map the API error envelope `code` to user messages. Branch on
  `code`, never on `message`.

What is explicitly outside the scope?

- Multi-language, and role-based navigation

---

## Implemented

- `app/layout.tsx` — root layout: Noto Sans (UI and wordmark), Belleza (page, card
  and dialog titles) and Noto Sans Mono (order numbers, SKUs) through `next/font`,
  the storefront's two faces plus a mono; `next-themes` with the `class`
  strategy; `TooltipProvider`; the `sonner` `Toaster`; `noindex` metadata and a
  `%s | <brand> admin` title template.
- `app/(admin)/layout.tsx` — every signed-in route. Reads `GET /auth/me/` and the
  `sidebar_state` cookie in parallel, and renders `SidebarProvider` + `AppSidebar` +
  `SidebarInset`.
- `components/shell/AppSidebar.tsx` — the shadcn `sidebar` with `collapsible="icon"`:
  wordmark, two groups (Shop: Dashboard, Orders; Catalogue: Products, Brands,
  Categories, Shades, Sizes, Skin types), `aria-current="page"` on the active item, a rail, and
  the user menu in the footer. On mobile the same component renders as a `sheet`
  and closes when a link is followed.
- `components/shell/UserMenu.tsx` — `dropdown-menu` with the staff email, a
  Light/Dark/System radio group, and **Sign out**.
- `components/shell/PageHeader.tsx` — sidebar trigger, `breadcrumb`, page title,
  **Refresh data** (`RefreshButton`: refetches the page's active queries) and a
  `children` slot for the primary action.
- `components/shell/QueryProvider.tsx` — the TanStack Query client for the signed-in
  frame, rendered by `app/(admin)/layout.tsx`
  ([tanstack-query.md](tanstack-query.md)).
- `components/shell/LoadFailure.tsx` — the `empty`-based failure panel with the error
  digest and a **Try again** that resets failed queries and calls Next's `retry()`; re-exported by
  `app/error.tsx` (catches the admin layout) and `app/(admin)/error.tsx` (catches
  pages inside the frame).
- `app/(admin)/loading.tsx` — `skeleton` placeholders shaped like a page header, a
  KPI row and a table.
- `app/not-found.tsx` — `empty` with a link back to the dashboard.
- `app/globals.css` — the storefront's tokens as shadcn variables for light and
  `.dark` (see [Theme tokens](#theme-tokens)), plus `--success`, `--warning` and
  `--info`, the radius scale, the `wordmark` utility, and tabular figures on `body`.
- `components/shell/AppSidebar.tsx` — the brand mark is a square charcoal tile with
  the initial in bold Noto Sans; the name is the storefront's TRUELUX wordmark. The
  sign-in page uses the same wordmark.
- `components/ui/badge.tsx` — square (2px) badges; `success`, `warning`, `info` and
  `destructive` are a 10% tint of the status hue with a 30% border and text in the
  hue; `secondary` (Shipped) is stone with an `--input` border.
- `components/ui/button.tsx` — `outline` takes the `--input` border; `destructive`
  keeps a 10% tint in dark mode too, so its text holds 4.5:1; `link` is underlined,
  because charcoal link text is otherwise indistinguishable from body text.
- `components/ui/checkbox.tsx`, `components/ui/empty.tsx` — the radius scale and
  the heading face.
- `components/ui/sidebar.tsx` — the mobile sheet's title and description are real
  copy.
- `hooks/use-mobile.ts` — rewritten on `useSyncExternalStore`; the generated version
  set state inside an effect and failed `react-hooks/set-state-in-effect`.
- `lib/api/errors.ts` — `ApiError`, `ApiUnreachableError`, envelope parsing,
  `describeError` (code → sentence) and `fieldErrors` (a 400's `details` → one
  message per field).
- `lib/actions/attempt.ts` — runs an API call inside a server action and returns an
  `ActionResult`, rethrowing Next's `redirect`/`notFound` signals and anything that is
  not an API failure.

### Theme tokens

Shared values are the storefront's (`../front-end/app/globals.css`); the admin adds
status hues and a sidebar.

| Token                                 | Light                               | Dark                 | Role                                 |
| ------------------------------------- | ----------------------------------- | -------------------- | ------------------------------------ |
| `--background`                        | `#fdfdfb`                           | `#1b1b1a`            | Page                                 |
| `--foreground`, `--primary`, `--ring` | `#333333`                           | `#ecebe6`            | Text, primary buttons, focus         |
| `--card`, `--popover`                 | `#ffffff`                           | `#232322`            | Cards, menus, dialogs                |
| `--muted`, `--accent`                 | `#f3f2ee` greige                    | `#252523`, `#2e2d2a` | Table heads, hovers                  |
| `--secondary`                         | `#e8e6dd` stone                     | `#2e2d2a`            | The Shipped badge, secondary buttons |
| `--muted-foreground`                  | `#66655f`                           | `#a9a8a1`            | Secondary text                       |
| `--border`                            | `#d6d5cf`                           | `#3a3936`            | Hairlines                            |
| `--input`                             | `#8a8983`                           | `#7d7c76`            | Control borders                      |
| `--destructive`                       | `#a3392f` brick                     | `#e0776b`            | Cancelled, destructive actions       |
| `--success`                           | `#3f6546` sage                      | `#93b99a`            | Delivered, Active                    |
| `--warning`                           | `#86591a` ochre                     | `#d9ae6c`            | Pending, low stock                   |
| `--info`                              | `#3f5a78` slate                     | `#9db4cf`            | Confirmed                            |
| `--chart-1`…`5`                       | charcoal, bronze, sage, clay, slate | lighter equivalents  | Charts                               |
| `--sidebar`                           | `#f3f2ee` greige                    | `#202020`            | Sidebar                              |
| `--sidebar-accent`                    | `#e8e6dd` stone                     | `#2e2d2a`            | Active nav item                      |

Radii: `rounded-sm`/`md`/`lg` are 2px (controls, badges, menus); `rounded-xl` and up
are `--radius`, 0.375rem, the storefront's card radius (cards, dialogs, empty
states).

Measured contrast (WCAG): muted-foreground on the sidebar 5.2:1 (dark 6.8:1), on the
active item 4.7:1 (5.8:1); status text on its badge tint 5.3–6.2:1 (dark 4.6–6.1:1);
input border on a card 3.5:1 and on the sidebar 3.1:1 (dark 3.8:1, 3.9:1); every
chart colour at least 3.8:1 against a card. Chart colours are told apart by hue, not
lightness; only `--chart-1` is drawn today.

---

## Remaining

None.

---

## Decisions

### Decision: one failure panel, two boundaries

**Decision**

`app/error.tsx` and `app/(admin)/error.tsx` both re-export `LoadFailure`.

**Reason**

An `error.tsx` does not wrap the layout of its own segment, so the admin layout's
`getMe()` failure is caught only by the root boundary. The inner boundary keeps the
sidebar on screen for a page failure.

**Consequence**

A failure in the admin layout renders without the sidebar.

### Decision: status colours are badge variants

**Decision**

Order status colours are the `warning`, `info`, `secondary`, `success` and
`destructive` badge variants, mapped once in `lib/orders/status.ts`.

**Reason**

ADR 0002 forbids colours at call sites; a variant keeps the colour in the theme.

**Consequence**

Every place that shows a status uses `OrderStatusBadge`. The badge always carries the
status name, so colour is never the only signal; the hues are muted to sit in the
greige palette.

---

## Gotchas

- The shared tokens are copied, not imported: the two apps are separate
  repositories. A storefront palette change needs the same change here.
- Noto Sans is wider than the previous face. The dashboard's low-stock table lets
  the product name wrap so the stock column fits at 1400px with the sidebar open.

- `next-themes` writes the class on `<html>` before hydration, so `<html>` carries
  `suppressHydrationWarning`. `UserMenu` reads `theme` only inside the closed dropdown,
  so nothing it renders on the server depends on it.
- Server Component errors reach the browser as a digest only. `LoadFailure` shows the
  digest; the message stays in the Vercel log.
- The `sidebar_state` cookie is written by the shadcn component in the browser and is
  not httpOnly. It holds only `true`/`false`.

---

## Routes

```text
/            (admin) group, dynamic (cookies)
/_not-found  static
```

---

## API

### Calls

```text
GET /api/v1/auth/me/        server (admin layout), no-store
```

### Errors handled

Mapping lives in `lib/api/errors.ts#describeError`; see
[architecture.md](../architecture.md#error-handling).

---

## State and data

- `sidebar_state` cookie (shadcn): sidebar expanded or collapsed.
- `theme` in `localStorage` (`next-themes`): `light`, `dark` or `system`.

---

## Accessibility

- The active nav link carries `aria-current="page"`, not only the active style.
- In icon-rail mode each nav button has a tooltip with its label; the label is also
  in the accessible name.
- The skeleton wrapper is `aria-busy` with a label, so a screen reader announces a
  load rather than silence.

---

## Tests

- `lib/api/client.test.ts` — envelope parsing: code, details and request id; a
  non-JSON body becomes `server_error`; a transport failure is `ApiUnreachableError`.
- `lib/auth/actions.test.ts` — `attempt` keeps a redirect a redirect.

---

## Files

```text
app/layout.tsx
app/error.tsx
app/not-found.tsx
app/globals.css
app/(admin)/layout.tsx
app/(admin)/loading.tsx
app/(admin)/error.tsx
components/shell/
components/ui/
hooks/use-mobile.ts
lib/api/errors.ts
lib/actions/attempt.ts
lib/orders/status.ts
```
