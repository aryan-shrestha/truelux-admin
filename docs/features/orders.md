# Orders

Status: Planned

Last updated: 2026-09-25

---

## Goal

Let the merchant work the COD order queue: confirm, ship, deliver or cancel.

---

## Scope

What is included in this implementation?

- `/orders`: a server-paginated `data-table` of number, date, customer, phone,
  items, total and a status `badge`.
  - Status `tabs` (All, Pending, Confirmed, Shipped, Delivered, Cancelled), search,
    and a date range (`calendar` + `popover`), all in the URL.
- `/orders/[id]`: customer and address `card`, items `table` with line totals,
  subtotal, shipping and total, and the note.
  - Action buttons are rendered from `allowed_transitions` only.
  - Cancel is behind an `alert-dialog` that says stock will be restored.
  - Errors are mapped from `invalid_status_transition`, `order_already_shipped` and
    `order_not_cancellable`.
- Status badge colours are consistent everywhere, from one map in
  `lib/orders/status.ts`.

---

## Context

Backend `admin-api.md` § Orders. The flow is `pending → confirmed → shipped →
delivered`, with cancel from `pending` or `confirmed`.
