# App shell

Status: Planned

Last updated: 2026-09-25

---

## Goal

Give every signed-in screen a consistent frame: navigation, page header, feedback
and error handling.

---

## Scope

What is included in this implementation?

- shadcn `sidebar` layout: TrueLux wordmark; nav items Dashboard, Orders, Products,
  Brands, Categories, Shades, Sizes; the signed-in user's email and **Sign out** in
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
