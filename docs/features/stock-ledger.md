# Stock ledger

Status: Implemented

Last updated: 2026-10-12

---

## Goal

Let staff record what happened to a variant's stock (a delivery, a breakage, a
count) without overwriting orders placed meanwhile, and see every change with who
made it.

---

## Scope

What is included in this implementation?

- **Saved variants**: stock is read-only, and the edit sheet's **Save** never sends it
- **Change stock dialog**, one per saved variant. Staff choose what happened:
  received, returned, damaged, expired, tester or sample, correction (adds),
  correction (removes), or counted the shelf. The quantity is always positive; the
  choice fixes the sign.
- **Stock history sheet**, one per saved variant: the latest 50 movements
- **New variants**: the add sheet still takes the opening stock as an input

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

None.

---

## Implemented

All in `src/features/products/` (stock belongs to the variant):

- `schemas/stock-change.schema.ts` — `STOCK_CHANGE_SCHEMA` (`kind`, `quantity`,
  `note` ≤ 500), `STOCK_CHANGE_OPTIONS` (received, returned, damaged, expired, tester
  or sample, correction adds/removes, counted the shelf) and `toStockChange`, the one
  place a sign is applied. A count may be 0; every adjustment needs at least 1; a
  quantity is a whole number ≥ 0. Order-only reasons (sale, cancellation) and
  stocktake cannot be chosen.
- `schemas/stock-movement.schema.ts` — `STOCK_MOVEMENT_SCHEMA` and
  `STOCK_REASON_LABEL`.
- `repositories/products.repository.ts` — `adjustStock`
  (`POST variants/{id}/stock-adjustments/`), `listStockMovements`
  (`GET stock-movements/?variant=&limit=50`); a count is `updateVariant` with
  `stock_quantity`.
- `queries/products.queries.ts` — `stockKeys` (`["stock-movements", variantId]`),
  `stockQueries.variant` (`volatile`).
- `queries/products.mutations.ts` — `useChangeStock`: an adjustment or a count,
  invalidating the product, product lists, the dashboard and that variant's history.
  Variant saves and deletes (`afterVariantChange`) and order moves
  (`useTransitionOrder`) now also invalidate every history.
- `components/stock-dialog.tsx` — **Change stock of {SKU}**: what happened, how many,
  a note (hidden for a count, which carries none). For a count, the quantity's help
  says it replaces the stock, so a sale made since counting is lost. The API's
  `quantity_change` or `stock_quantity` error lands on **How many**; anything else is
  a form alert (`not_found`: "This variant no longer exists.").
- `components/stock-history.tsx` — **Stock history of {SKU}** in a `sheet`, fetched
  when opened: a skeleton, an error alert or an empty state; when, what (reason, the
  order number linked to the order, the note), the signed change, the balance after,
  who (the API's email, or "Customer" for a sale); "Showing the latest N of M
  changes." when there are more.
- `components/variant-row.tsx` — a row shows its stock; **Change stock** and **Stock
  history** are items in the row's actions menu, which opens them (both are
  controlled, with no trigger of their own). A delete `409` suggests setting the
  stock to 0 instead.

---

## Remaining

- A live-API Playwright check has not been written: changing stock records real
  movements, and the products and sale-price specs already create and delete their
  own data.

---

## Decisions

### Decision: stock leaves the variant's save

**Decision**

Saving a saved variant sends everything except `stock_quantity`; stock changes only
through the dialog.

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

- `schemas/stock-change.schema.test.ts` — each kind's reason and sign; a count of 0;
  0 refused for an adjustment; `abc`, `1.5` and `-2` refused; sale, cancellation and
  stocktake refused.
- `components/stock.test.tsx` — a removal is a negative adjustment with its reason
  and note, and the row shows the refetched stock; a count sends only
  `stock_quantity`, hides the note and warns that a count overwrites sales; the
  API's quantity error lands on **How many**; nothing is sent without a reason or
  with 0; the history's signed changes, order link, note, "Customer", actor email and
  truncation line, sent for that variant; the empty history.
- `variants-editor.test.tsx` — the edit sheet has no stock field and sends no
  `stock_quantity`; the delete `409` message.

---

## Files

```text
src/features/products/schemas/stock-change.schema.ts
src/features/products/schemas/stock-movement.schema.ts
src/features/products/components/stock-dialog.tsx
src/features/products/components/stock-history.tsx
src/features/products/components/variant-row.tsx
src/features/products/components/variant-sheet.tsx
```

---

## Future context

None.
