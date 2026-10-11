# Stock ledger

Status: Planned

Last updated: 2026-10-11

---

## Goal

Let staff record what happened to a variant's stock (a delivery, a breakage, a
count) without overwriting orders placed meanwhile, and see every change with who
made it.

---

## Scope

What is included in this implementation?

- **Saved variant rows**: stock is read-only, and the row's **Save** never sends it
- **Change stock dialog**, one per saved variant. Staff choose what happened:
  received, returned, damaged, expired, tester or sample, correction (adds),
  correction (removes), or counted the shelf. The quantity is always positive; the
  choice fixes the sign.
- **Stock history sheet**, one per saved variant: the latest 50 movements
- **New variants**: a draft row still takes the opening stock as an input

What is explicitly outside the scope?

- A shop-wide ledger page, or filters by reason or order
- Paging past the latest 50 movements
- Returns as an order flow; staff record a return as **Returned by a customer**

---

## Context

- Requirements ported from `../admin/docs/features/stock-ledger.md` (Implemented
  there).
- API: `back-end/docs/features/inventory.md` and back-end ADR 0019; endpoints in
  `admin-api.md` § Products.
  - `POST admin/variants/{id}/stock-adjustments/` — relative: `quantity_change`
    (signed), `reason` (`received`, `returned`, `damaged`, `expired`, `tester`,
    `correction`), `note` (optional, ≤ 500). `201` with the movement.
  - `PATCH admin/variants/{id}/` `stock_quantity` — absolute; recorded as a
    `stocktake`.
  - `GET admin/stock-movements/?variant=` — paginated, newest first.
  - A sign that contradicts the reason, a zero change, or a change below zero is
    `400 validation_error` on `quantity_change`.
- Builds on [products.md](products.md)' variants editor.

---

## Planned

- `src/features/products/` (stock belongs to the variant) — `stock.repository.ts`
  (`adjustStock`, `setStockCount`, `listStockMovements`), `stock.schema.ts`
  (`stockChangeSchema`: `kind`, `quantity`, `note`; `STOCK_CHANGE_OPTIONS`;
  `toStockChange`, the one place a sign is applied), `stock-movement.schema.ts`,
  `stock.queries.ts` (`["stock-movements", variantId]`, `volatile`),
  `stock-reasons.ts` (labels), `components/stock-dialog.tsx`,
  `components/stock-history.tsx`.
- `count` maps to an absolute `stock_quantity` and may be 0; every other kind needs
  at least 1. **Note** is hidden for a count, because the PATCH carries none.
- The API's `quantity_change` or `stock_quantity` error is shown on the form's
  **How many** field.
- The history sheet fetches when it opens (no prefetch): a skeleton, an error alert,
  or an empty state; columns when, what (the order number linked to `/orders/{id}`,
  and the note), the signed change, the balance after, and who (the API's email, or
  "Customer" for a sale); "Showing the latest N of M changes." when there are more.
- A saved row shows the figure, preceded by visually hidden "Stock of {SKU}:", with
  two icon buttons named "Change stock of {SKU}" and "Stock history of {SKU}".
- A stock change invalidates the product, product lists, the dashboard and that
  variant's history; an order transition invalidates every history.
- Add shadcn `sheet` (exists), `select`, `textarea` when building.

Error treatment: `validation_error` on `quantity_change`/`stock_quantity` on **How
many**, other fields or a message as the form alert; `not_found` (variant deleted) as
a form alert.

Planned tests: each kind's reason and sign; a count of 0; 0 refused for an
adjustment, and NaN, fractions, negatives and order reasons refused; what is sent for
a removal and for a count; the API's error lands on the quantity; invalid input sends
nothing; the variant update body drops `stock_quantity`; the history's signed
changes, order link, actor, truncation line and empty state.

---

## Implemented

None.

---

## Remaining

- Everything in Planned. Depends on [products.md](products.md).
- A count is absolute, so it replaces any sale made between counting and saving. The
  dialog must say so; adjustments do not have the problem.

---

## Decisions

### Decision: stock leaves the row's save

**Decision**

A saved variant's **Save** sends everything except `stock_quantity`; stock changes
only through the dialog.

**Reason**

Carried over from `../admin`: a row holding the stock from page load overwrote
storefront sales made meanwhile, and with the ledger it would also record a stocktake
nobody did.

**Consequence**

Editing stock is a deliberate act with a reason.

### Decision: the reason fixes the sign

**Decision**

The dialog offers "Damaged (removes)", "Correction (adds)" and so on, and the
quantity is always positive.

**Reason**

The API refuses a sign that contradicts the reason; letting staff type `-2` for a
delivery would only produce that error.

**Consequence**

`toStockChange` is the one place the sign is applied.

---

## Gotchas

- A movement's `variant_id` is `null` once the variant is deleted; the sheet is only
  reachable from a live variant, so it never shows one.
- `actor_email` is `null` for a sale; show "Customer".

---

## API

```text
POST  /api/v1/admin/variants/{id}/stock-adjustments/
PATCH /api/v1/admin/variants/{id}/                   { "stock_quantity": n }
GET   /api/v1/admin/stock-movements/?variant={id}&limit=50
```

---

## Data changes

- Query key `["stock-movements", variantId]`.

---

## Permissions

Signed-in staff (the API).

---

## Tests

None yet; see Planned.

---

## Files

```text
src/features/products/repositories/stock.repository.ts   planned
src/features/products/components/stock-dialog.tsx        planned
src/features/products/components/stock-history.tsx       planned
```

---

## Future context

None.
