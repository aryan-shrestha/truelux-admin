# Sale prices

Status: Implemented

Last updated: 2026-10-12

---

## Goal

Let the merchant put a variant on sale by entering its "was" price, and see at a
glance which products are on sale.

---

## Scope

What is included in this implementation?

- **Variants editor**: an optional **Compare-at price** in the variant sheet and a
  column in the table, with a
  "−{discount_percent}%" `badge` when the API reports the variant on sale. Help text:
  lower the price or set an override, enter the old price here, clear it to end the
  sale.
- **Validation**: the Zod schema checks the decimal format only. "Above the price" is
  the API's rule; its `400 validation_error` on `compare_at_price` shows under
  the field in the variant sheet.
- **Products list**: an "On sale" `badge` beside the published badge, and a **Sale**
  filter ("Any price" / "On sale") in the URL.
- Saves invalidate the product detail and every product list.

What is explicitly outside the scope?

- Bulk "put this category on sale" actions
- Scheduled sales

---

## Context

- Requirements ported from `../admin/docs/features/sale-prices.md` (Implemented
  there).
- API: `back-end/docs/features/sale-prices.md` § Admin and `admin-api.md`
  § Products. Variants carry `compare_at_price` (read and write), `on_sale` and
  `discount_percent` (read-only); list items carry `on_sale`;
  `GET admin/products/?on_sale=true` filters (`true`/`false` only, anything else is
  400).
- Builds on [products.md](products.md): the variant sheet form, its save, and the
  product filters.

---

## Planned

None.

---

## Implemented

- `src/features/products/schemas/variant-form.schema.ts` — `compare_at_price` and
  `price_override` share one optional-amount rule: trimmed, blank allowed (sent as
  `null` by `variant-body.ts`), a decimal string with up to two places, more than 0
  (checked on the digits, never as a float). Whether a compare-at exceeds the price is
  left to the API.
- `components/variant-sheet.tsx` — **Compare-at price** (an `Rs` group, placeholder
  "Not on sale") below **Price override**.
- `components/variant-row.tsx` — the **Compare-at price** cell (the amount, or "—")
  and an `info` "−{discount_percent}%" badge only when the saved variant's `on_sale`
  is true. Both values come from the API.
- `components/variants-editor.tsx` — the help text: lower the price or set an
  override, enter the old price as the compare-at, save; clear it to end the sale.
- The API's `compare_at_price` field error lands under the field in the sheet
  (`showApiError`).
- Built with [products.md](products.md) slice 1: `?on_sale=true` in the products
  route's `validateSearch` (any other value dropped), sent as the API's
  `on_sale=true`; an `info` "On sale" badge in `products-table.tsx` when the list item's
  `on_sale` is true.

---

## Remaining

- `e2e/sale-prices.spec.ts` has not been run against the live API (see
  [staff-auth.md](staff-auth.md#remaining)).

---

## Decisions

### Decision: the column is labelled "(Rs)", not "(NPR)"

**Decision**

"Compare-at price (Rs)", matching "Price override (Rs)" beside it and the money
format's `Rs` prefix.

**Reason**

Two currency spellings side by side read as two currencies.

**Consequence**

The back-end's workbook column stays "Compare-at price (NPR)"; only the admin UI
differs.

---

## Gotchas

- A compare-at at or below the price passes the schema and is rejected by the API.
- Repricing a variant or product below an existing compare-at is allowed by the API
  and silently ends the sale; the list's `on_sale` shows the result.
- Checkout still charges `price`; the compare-at is display only.

---

## API

```text
PATCH /api/v1/admin/variants/{id}/       compare_at_price
POST  /api/v1/admin/products/{id}/variants/
GET   /api/v1/admin/products/?on_sale=true
```

---

## Data changes

- URL: `on_sale` on `/products`.

---

## Permissions

Signed-in staff (the API).

---

## Tests

- `src/features/products/variant-body.test.ts` — a blank compare-at is `null`; a
  value is kept as typed whatever the price; `0`, `0.00`, `-1`, `3,200`, `12.345` and
  `abc` are rejected.
- `src/features/products/schemas/product-filters.schema.test.ts` — `on_sale` other
  than `true` (`yes`, `1`, `false`) is dropped; `products-list.test.tsx` — `on_sale=true`
  reaches the API query, and only rows the API marks `on_sale` get the badge.
- `src/features/products/components/variants-editor.test.tsx` — the discount badge
  shows only on a variant the API marks on sale, "—" without a compare-at; the API's
  compare-at error lands on the sheet's field.
- `e2e/sale-prices.spec.ts` — creates a product, puts its variant on sale, sees the
  badge and the list filter, and deletes the product (live API; skipped without staff
  credentials).

---

## Files

```text
src/features/products/schemas/variant-form.schema.ts
src/features/products/variant-body.ts
src/features/products/components/variant-row.tsx
src/features/products/components/variant-sheet.tsx
src/features/products/components/variants-editor.tsx
src/features/products/components/products-table.tsx
src/features/products/schemas/product-filters.schema.ts
e2e/sale-prices.spec.ts
```

---

## Future context

None.
