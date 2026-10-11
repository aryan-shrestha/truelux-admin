# Sale prices

Status: Planned

Last updated: 2026-10-11

---

## Goal

Let the merchant put a variant on sale by entering its "was" price, and see at a
glance which products are on sale.

---

## Scope

What is included in this implementation?

- **Variants editor**: an optional **Compare-at price (Rs)** column, with a
  "−{discount_percent}%" `badge` when the API reports the variant on sale. Help text:
  lower the price or set an override, enter the old price here, clear it to end the
  sale.
- **Validation**: the Zod schema checks the decimal format only. "Above the price" is
  the API's rule; its `400 validation_error` on `compare_at_price` shows on that
  row's cell.
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
- Builds on [products.md](products.md): the variant row form, its save, and the
  product filters.

---

## Planned

- `variant.schema.ts` — `compare_at_price` shares the optional-price rule with
  `price_override`: trimmed, blank becomes `null`, decimal format, more than 0.
- `variant-row.tsx` — the compare-at cell (placeholder "Not on sale", `aria-label`
  "Compare-at price of {sku}") and the badge only when the saved variant's `on_sale`
  is true. Both values come from the API; nothing is compared in the browser.
- The API's `compare_at_price` field error lands on that row's cell, not another row
  and not as a form alert.
- Products route: `on_sale=true` in `validateSearch`, mapped to the API's
  `on_sale=true`; other values dropped. `products-table.tsx`: an `info` "On sale"
  badge when the list item's `on_sale` is true.

Planned tests: a blank compare-at is `null`; a value is kept as a string whatever
the price; `0`, `-1`, `3,200`, `12.345` and `abc` are rejected; `on_sale=true`
reaches the API query and other values are dropped; the badge shows only for a
variant the API marks `on_sale`; the field error lands on the edited row; only rows
the API marks `on_sale` get the list badge; Playwright against the live API, restoring
the variant afterwards.

---

## Implemented

None.

---

## Remaining

- Everything in Planned. Depends on [products.md](products.md).

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

None yet; see Planned.

---

## Files

```text
src/features/products/schemas/variant.schema.ts       planned
src/features/products/components/variant-row.tsx      planned
src/features/products/components/products-table.tsx  planned
src/routes/_dashboard/products/index.tsx              planned
```

---

## Future context

None.
