# Sale prices

Status: Implemented

Last updated: 2026-09-29

---

## Goal

Let the merchant put a variant on sale by entering its "was" price, and see at a
glance which products are on sale.

---

## Scope

What is included in this implementation?

- **Variants editor** on the product page: a new optional **Compare-at price (Rs)**
  column, with a "−15%" `badge` when the API reports the variant on sale. The card's help text explains how to run a sale: lower the price or set
  an override, and enter the old price here. Clear it to end the sale.
- **Validation:**
  - The zod schema checks the decimal format only. "Above the price" is the
    API's rule, and a `400 validation_error` on `compare_at_price` is shown on
    that cell.
  - Money stays a string and is never compared in the browser (ADR 0003).
- **Products list:** an "On sale" `badge` beside the published badge, and an
  "On sale" option in the filters (URL state, ADR 0005 pattern).
- Mutations follow ADR 0005: a server action inside `useMutation`, then
  invalidate the product and list queries.

What is explicitly outside the scope?

- Bulk "put this category on sale" actions
- Scheduled sales

---

## Context

- API contract: `../back-end/docs/features/sale-prices.md`, section Admin.
  Variant read and write carry `compare_at_price`; the list items carry
  `on_sale`.
- `GET admin/products/?on_sale=true` filters the list.

---

## Implemented

- `lib/api/types.ts` — `Variant.compare_at_price`, `Variant.on_sale`,
  `Variant.discount_percent` and `VariantWrite.compare_at_price`,
  `ProductListItem.on_sale`, `ProductQuery.on_sale`.
- `lib/products/schemas.ts` — `compare_at_price` shares `optionalPrice` with
  `price_override`: trimmed, blank becomes `null`, decimal format, more than 0.
- `components/products/VariantRow.tsx`, `VariantsEditor.tsx` — the compare-at cell
  (placeholder "Not on sale", `aria-label` "Compare-at price of {sku}"), an `info`
  "−{discount_percent}%" badge beside it only when the saved variant's `on_sale` is
  true (both values from the API, nothing compared in the browser), and the help
  text. The API's `validation_error` on `compare_at_price` lands on that row's cell
  through `useActionForm`'s field mapping. Saves use the existing
  `saveVariant`/`addVariant` actions and `afterVariantChange`, which already
  invalidates the detail and every list.
- `lib/products/query.ts` — `?on_sale=true` ↔ `ProductFilters.onSale` ↔ API
  `on_sale=true`; any other value is dropped.
- `components/products/ProductsView.tsx` — a **Sale** `UrlSelect` ("Any price" /
  "On sale").
- `components/products/ProductsTable.tsx` — an `info` "On sale" badge in the Status
  cell when the API's `on_sale` is true.

---

## Remaining

None.

---

## Decisions

### Decision: the column is labelled "(Rs)", not "(NPR)"

**Decision**

"Compare-at price (Rs)", matching "Price override (Rs)" beside it and
`formatMoney`'s `Rs` prefix.

**Reason**

Two currency spellings side by side in one table read as two currencies.

**Consequence**

The backend's workbook column stays "Compare-at price (NPR)"; only the admin UI
differs.

---

## Gotchas

- A compare-at at or below the price is accepted by the schema and rejected by the
  API. Repricing a variant or product below an existing compare-at is allowed by the
  API and silently ends the sale; the list's `on_sale` shows the result.
- The row's field error widens the compare-at column (as a price override error
  already does), so the table scrolls sideways while the message is shown.

---

## Tests

- `lib/products/schemas.test.ts` — a blank compare-at is `null`; a value is kept as
  a string whatever the price; `0`, `-1`, `3,200`, `12.345`, `abc` are rejected on
  `compare_at_price`; the schema re-parses its own output.
- `lib/products/query.test.ts` — `on_sale=true` reaches the API query and the link;
  other values are dropped.
- `components/products/VariantsEditor.test.tsx` — the API's percent badge shows on
  a variant it marks `on_sale` and not on one with a compare-at it does not; a
  `validation_error` on `compare_at_price` lands on the edited row's cell, not the
  other row and not as a form alert.
- `components/products/ProductsView.test.tsx` — only rows the API marks `on_sale`
  get the badge; choosing "On sale" writes `/products?on_sale=true`.
- `tests/e2e/sale-prices.spec.ts` — against the live API: on the first product not
  on sale, a compare-at below the price is refused on its cell; a compare-at of
  999999 puts it on sale, shows a "−N%" badge on the row, and it appears under
  `?on_sale=true` with the list badge; clearing it removes both badges; `afterAll` restores the variant's original value.
  Ran green on 2026-09-29.

---

## Files

```text
lib/api/types.ts
lib/products/schemas.ts
lib/products/query.ts
components/products/VariantRow.tsx
components/products/VariantsEditor.tsx
components/products/ProductsView.tsx
components/products/ProductsTable.tsx
tests/e2e/sale-prices.spec.ts
```
