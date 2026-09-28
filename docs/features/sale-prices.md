# Sale prices

Status: Planned

Last updated: 2026-09-29

---

## Goal

Let the merchant put a variant on sale by entering its "was" price, and see at a
glance which products are on sale.

---

## Scope

What is included in this implementation?

- **Variants editor** on the product page: a new **Compare-at price (NPR)**
  column (optional).
  - When it holds a value above the variant's price, the row shows a "−15%"
    `badge` computed by the API.
  - Help text explains how to run a sale: lower the price or set an override,
    and enter the old price here. Clear it to end the sale.
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

## Tests

To be written:

- Schema: an empty value is allowed and sent as `null`; a malformed amount is
  rejected.
- An API `validation_error` on `compare_at_price` lands on the right row and
  cell.
- The list shows the on-sale badge, and the filter writes `on_sale=true` to the
  URL.
- e2e against the live API:
  - set a compare-at, see the badge in the list;
  - clear it, see the badge gone;
  - restore the variant in `afterAll`.
