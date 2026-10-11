# Orders

Status: Implemented

Last updated: 2026-10-11

---

## Goal

Let the merchant work the cash-on-delivery order queue: confirm, ship, deliver or
cancel.

---

## Scope

What is included in this implementation?

- `/orders`: a server-paginated `DataTable` of number, placed date and time, customer,
  phone, units, total and a status `badge`
  - status `tabs` (All, Pending, Confirmed, Shipped, Delivered, Cancelled), search, a
    date range (`calendar` + `popover`) and the page, all in the URL
  - filtered and unfiltered empty states
- `/orders/$orderId`: a customer and address `card`, an items `table` with line
  totals, the API's subtotal, shipping fee and total, the payment method and the note
  - transition buttons rendered only from `allowed_transitions`
  - **Cancel order** behind an `alert-dialog` that says the items go back into stock
  - transition errors shown as toasts
- One status → label and badge-variant map, rendered only by `OrderStatusBadge`
  ([app-shell.md](app-shell.md))

What is explicitly outside the scope?

- Editing an order's lines, customer or address (the API has no such endpoint)
- Returns and refunds (deferred by the back-end)

---

## Context

- Requirements ported from `../admin/docs/features/orders.md` (Implemented there).
- API: `back-end/docs/features/admin-api.md` § Orders. The flow is
  `pending → confirmed → shipped → delivered`, with cancel from `pending` or
  `confirmed`. The API owns the state machine and returns `allowed_transitions`.
- Freshness `live` ([tanstack-query.md](tanstack-query.md)): the list and the detail
  poll every 60 s while shown.

---

## Planned

None.

---

## Implemented

- `src/features/orders/`:
  - `schemas/order-status.schema.ts` — `ORDER_STATUS_SCHEMA` (`pending`, `confirmed`,
    `shipped`, `delivered`, `cancelled`); `order-status.ts` — `ORDER_STATUS` (label
    and badge variant) and `TRANSITION_LABEL`
  - `schemas/order.schema.ts` — `ORDER_LIST_ITEM_SCHEMA`, `ORDER_ITEM_SCHEMA`,
    `ORDER_SCHEMA` (the detail), money as strings
  - `schemas/order-filters.schema.ts` — `ORDER_FILTERS_SCHEMA`, the list route's
    `validateSearch`: `status` (one or many; unknown dropped; de-duplicated and put in
    the API's order, so equal filters share one key), `q` (trimmed), `from`/`to`
    (`YYYY-MM-DD`), `page` (≥ 1). Each field falls back on its own.
  - `repositories/orders.repository.ts` — `listOrders` (filters → `status`,
    `search`, `created_after`, `created_before`, and `limit`/`offset` through
    `toListParams`), `getOrder`, `transitionOrder`
  - `queries/orders.queries.ts` — `orderKeys`; `orderQueries.list(filters)` (`live`,
    `keepPreviousData`) and `.detail(id)` (`live`)
  - `queries/orders.mutations.ts` — `useTransitionOrder`: writes the returned order
    into its detail key, invalidates order lists (`meta.invalidates`), toasts
    "TL-… is now <status>"; on failure toasts `describeError` and refetches the detail
  - `components/` — `orders-list` (tabs, search, date range and table, given the
    filters and a change handler by the route), `orders-table`, `status-tabs`,
    `order-search` (debounced 300 ms), `date-range-filter` (first click starts the
    range, second ends it; future days disabled; the label names the range),
    `order-detail`, `order-items-card`, `customer-card` (`tel:` link, note),
    `order-actions` (buttons from `allowed_transitions`; **Cancel order** behind
    `ConfirmDialog`), `order-status-badge`
- `src/routes/_dashboard/orders/index.tsx` — validates the search, starts the list
  prefetch without awaiting it, and sends filter changes to the URL with
  `replace`, dropping `page`.
- `src/routes/_dashboard/orders/$orderId.tsx` — awaits the detail; `not_found`
  renders the not-found page.
- `src/config/navigation.ts` — **Shop → Orders**.
- Shared, built here: `ConfirmDialog` and `EmptyState`
  (`src/components/feedback/`), `DataTable`'s link pager, `src/lib/money.ts`
  (`formatMoney`), `src/lib/date.ts`, and the HTTP client's repeated-key array
  params.

---

## Remaining

- `e2e/orders.spec.ts` has not been run against the live API; it needs the staff
  credentials (see [staff-auth.md](staff-auth.md#remaining)).
- The dashboard, products and stock history are added to `useTransitionOrder`'s
  `meta.invalidates` by those features, once their key factories exist (a cancel
  restores stock).

---

## Decisions

### Decision: the buttons come only from `allowed_transitions`

**Decision**

The detail page renders no transition the API did not list and does not derive the
flow itself.

**Reason**

The back-end's services own the state machine; a second copy here would drift.

**Consequence**

A stale page can still send a transition the API has since refused; its 422 is
toasted, and the detail refetches.

---

## Gotchas

- Totals are displayed, never computed: show the API's `subtotal`, `shipping_fee`
  and `total`.
- `variant_shade` is an empty string, not `null`, for a shadeless line.
- Order numbers are `TL-<year>-<6 digits>`, with gaps.
- `payment_method` is only ever `cod`, shown as "Cash on delivery".
- `item_count` is units (the sum of quantities), not lines.
- `created_after` and `created_before` are inclusive `Asia/Kathmandu` days. The date
  picker's days are the browser's local days; they agree for staff in Nepal.
- `status` must be sent as a repeated key (`status=a&status=b`); the HTTP client's
  `paramsSerializer: { indexes: null }` does this for every array param.
- `POST …/transition/` answers with the full order detail, so the page shows it
  without a refetch.
- The list route does not await its loader: awaiting would hold a filter change and,
  after a second, replace the whole page (search box included) with the pending
  skeleton. The table keeps the previous rows, dimmed, instead.
- react-day-picker's own range selection completes on the first click (a one-day
  range), so the date filter tracks the clicks itself.

---

## API

```text
GET  /api/v1/admin/orders/
GET  /api/v1/admin/orders/{id}/
POST /api/v1/admin/orders/{id}/transition/    { "to": "confirmed" | "shipped" | "delivered" | "cancelled" }
```

Shapes: `back-end/docs/features/admin-api.md` § Orders.

---

## Data changes

- Query keys `["orders", "list", filters]`, `["orders", "detail", id]`.
- URL: `status` (repeatable), `q`, `from`, `to`, `page`.

---

## Permissions

Signed-in staff (the API). Any staff user may move any order.

---

## Tests

- `schemas/order-filters.schema.test.ts` — statuses normalised (order, duplicates,
  unknown, single value); malformed dates, page and an empty search dropped.
- `components/orders-list.test.tsx` — rows with formatted total and badge; the URL's
  filters reach the API as `status` (repeated), `search`, `created_after`,
  `created_before`, `limit`, `offset`; a tab writes `?status=` and drops `page`; the
  previous rows stay (busy) while the next page loads; the empty states.
- `components/order-detail.test.tsx` — items, shade line, API totals, `tel:` link and
  note; an unknown id shows not-found; only allowed transitions render, none for a
  finished order; a move shows the returned order without a second GET; cancel needs
  the stock confirmation; each 422 code toasts its sentence and refetches.
- `components/order-status-badge.test.tsx` — labels and distinct variants.
- `src/components/data-table/data-table.test.tsx` — the pager links keep the other
  search params.
- `src/lib/money.test.ts`, `src/lib/date.test.ts`, and the repeated-key case in
  `src/lib/repositories/client.test.ts`.
- `e2e/orders.spec.ts` — list, a status tab, an order, back to the same filter.
  Skipped without the staff credentials.

---

## Files

```text
src/features/orders/
src/routes/_dashboard/orders/
src/components/feedback/confirm-dialog.tsx
src/components/feedback/empty-state.tsx
src/components/data-table/data-table.tsx
src/lib/money.ts
src/lib/date.ts
e2e/orders.spec.ts
```

---

## Future context

None.
