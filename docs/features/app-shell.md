# App shell

Status: Implemented

Last updated: 2026-09-26

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
- Theme: shadcn variables in `app/globals.css` sharing the storefront's TrueLux
  palette (ivory, espresso, rose-nude primary), with a denser, neutral admin feel.
  Light and dark via `next-themes`, with a toggle in the user menu.
- `lib/api/errors.ts`: map the API error envelope `code` to user messages. Branch on
  `code`, never on `message`.

What is explicitly outside the scope?

- Multi-language, and role-based navigation

---

## Implemented

- `app/layout.tsx` — root layout: Manrope (UI), Fraunces (headings and wordmark) and
  Geist Mono (order numbers, SKUs) through `next/font`; `next-themes` with the `class`
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
- `components/shell/PageHeader.tsx` — sidebar trigger, `breadcrumb`, page title and a
  `children` slot for the primary action.
- `components/shell/LoadFailure.tsx` — the `empty`-based failure panel with the error
  digest and a **Try again** that calls Next's `retry()`; re-exported by
  `app/error.tsx` (catches the admin layout) and `app/(admin)/error.tsx` (catches
  pages inside the frame).
- `app/(admin)/loading.tsx` — `skeleton` placeholders shaped like a page header, a
  KPI row and a table.
- `app/not-found.tsx` — `empty` with a link back to the dashboard.
- `app/globals.css` — the TrueLux theme as shadcn variables for light and `.dark`,
  plus `--success`, `--warning` and `--info`, and tabular figures on `body`.
- `components/ui/badge.tsx` — adds `success`, `warning` and `info` variants on those
  tokens.
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

Every place that shows a status uses `OrderStatusBadge`.

---

## Gotchas

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
