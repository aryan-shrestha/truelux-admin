# ADR 0002: shadcn/ui is the component library

Status: Accepted

Date: 2026-09-25

Supersedes: None

---

## Context

The storefront uses shadcn/ui (storefront ADR 0009). The admin should share its
vocabulary and theme.

---

## Decision

Every UI element comes from shadcn/ui components in `components/ui/`: tables are the
shadcn `data-table` pattern over TanStack Table, forms are the shadcn `form` over
react-hook-form + zod, and charts are shadcn `chart` over Recharts. No other UI kit.
Theme changes happen in `app/globals.css` variables or inside the generated
component files.

---

## Consequences

### Constraints introduced

- No hand-rolled primitive where a shadcn component exists.
- No hex colours in feature components.

---

## Implementation

```text
components.json
components/ui/
app/globals.css
```
