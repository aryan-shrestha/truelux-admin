# ADR 0004: The admin shares the storefront theme

Status: Accepted

Date: 2026-09-26

Supersedes: None

---

## Context

The storefront was restyled to the client's mockups (storefront ADR 0011): a
near-white page, charcoal text and primary, greige and stone surfaces, square or
near-square shapes, Noto Sans for the interface and Belleza for display. The admin
still used the superseded rose-nude and espresso palette with Fraunces and Manrope,
so the two apps read as different brands. `docs/features/app-shell.md` requires the
admin to share the storefront's palette with a denser, neutral admin feel.

---

## Decision

The admin's shadcn theme variables in `app/globals.css`, light and `.dark`, take the
storefront's token values; the admin adds only what the storefront has no use for:
the status hues (`--success`, `--warning`, `--info`), the sidebar tokens (greige,
with a stone active item) and a chart series in the same family. Fonts are the
storefront's Noto Sans and Belleza through `next/font`, plus Noto Sans Mono for
SKUs and order numbers. Controls, badges and menus take a 2px radius; cards and
dialogs take the storefront's 0.375rem card radius. The sidebar name is the
storefront's wordmark (bold, tracked, uppercase Noto Sans), exposed as a `wordmark`
utility.

The look is tailored in `app/globals.css` and `components/ui/*` (ADR 0002).

---

## Reason

One brand across the customer's and the merchant's apps. Copying the values keeps
the admin a separate deployable with no build-time link to the storefront.

---

## Alternatives considered

### Square controls, as on the storefront

Why it was not chosen:

The admin is dense: 32px controls sit in rows of filters and table actions, where a
2px radius separates adjacent boxes better than hard corners, and still reads as
square beside the storefront.

### A shared token package

Why it was not chosen:

The apps are separate repositories with separate deployments; a package for about
thirty values adds a release step to every palette change.

---

## Consequences

### Positive

- The admin and the storefront read as one brand.
- Status hues are muted but distinct, and every status badge carries its name.

### Negative

- The shared values are duplicated and can drift.

### Constraints introduced

- A change to the storefront's palette, type or radius is repeated in the admin's
  `app/globals.css` and `app/layout.tsx`.
- Text keeps WCAG AA (4.5:1) and control boundaries 3:1; the measured figures are in
  `docs/features/app-shell.md`.

---

## Implementation

```text
app/globals.css
app/layout.tsx
components/ui/badge.tsx
components/ui/button.tsx
components/shell/AppSidebar.tsx
docs/features/app-shell.md
```

---

## Future reconsideration

If the storefront and the admin move into one repository, share the tokens from one
stylesheet.
