# Orders

Status: In progress

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
  - status `tabs` (All, Pending, Confirmed, Shipped, Delivered, Cancelled), search, and
    a date range (`calendar` + `popover`), all in the URL
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

- `src/features/orders/` — `orders.repository.ts` (`listOrders`, `getOrder`,
  `transitionOrder`), `order.schema.ts`, `orders.queries.ts` (`orderKeys`,
  `orderQueries.list(filters)`, `.detail(id)`), `orders.mutations.ts`
  (`useTransitionOrder`: writes the returned order into its detail key, invalidates
  order lists, the dashboard, products and stock history), `components/`
  (`orders-table`, `status-tabs`, `date-range-filter`, `order-items-card`,
  `customer-card`, `order-actions`). `order.schema.ts` reuses
  `ORDER_STATUS_SCHEMA` for `status` and `allowed_transitions`.
- `src/routes/_dashboard/orders/index.tsx` — `validateSearch`: `status` (repeatable,
  known statuses only, normalised to the API's order), `q`, `from`, `to` (ISO dates),
  `page`. Maps to `status`, `search`, `created_after`, `created_before`, `limit` 25,
  `offset`.
- `src/routes/_dashboard/orders/$orderId.tsx` — loader ensures the detail; a
  `not_found` renders the not-found page.
- Status tabs: a URL with two or more statuses (the dashboard's awaiting-action link)
  selects no tab. On a narrow screen the tab list scrolls inside its wrapper.
- Date range: two-month `calendar` in range mode, written to the URL once both ends
  are chosen, a clear button, future days disabled; the button's accessible name
  includes the range.
- The detail grid is one column below `xl`, so the items table scrolls inside its card
  on a phone. The phone number is a `tel:` link.
- List state follows the list-state rules in [tanstack-query.md](tanstack-query.md#rules-for-features):
  filters, search and tabs write the URL with `navigate({ search, replace: true })`,
  pagination is a real `Link`, rows stay while the next page loads
  (`keepPreviousData`), and the normalised filters are the query key.
- `src/config/navigation.ts` — **Shop → Orders**, after Dashboard (from
  [app-shell.md](app-shell.md)).
- `src/components/feedback/confirm-dialog.tsx` — `ConfirmDialog` on `alert-dialog`,
  first used by cancel; and `empty-state.tsx` — `EmptyState` on shadcn `empty`, first
  used by the filtered and unfiltered empty list. Both are shared, so taxonomy and
  products reuse them (from [app-shell.md](app-shell.md)).
- Add shadcn `tabs`, `calendar`, `popover`, `empty`, `alert-dialog` when building.

Error treatment:

| `code`                      | Treatment                                                           |
| --------------------------- | ------------------------------------------------------------------- |
| `invalid_status_transition` | Toast: "The order cannot move to that status from where it is now." |
| `order_already_shipped`     | Toast: "The order has already shipped…"                             |
| `order_not_cancellable`     | Toast: "Only pending or confirmed orders can be cancelled."         |
| `not_found` (read)          | The not-found page                                                  |

Planned tests: only allowed transitions render, none for a finished order; cancel
needs the confirm that mentions stock; each 422 code's sentence is toasted; the
returned order lands in the cache and the lists and dashboard are invalidated;
repeated statuses, search and dates reach the API query and unknown values are
dropped; statuses in a different order share one query key; a page change keeps the
old rows until the new page arrives; every status has a distinct badge; Playwright from the dashboard to the list
and an order.

---

## Implemented

Built with the app shell ([app-shell.md](app-shell.md)):

- `src/features/orders/schemas/order-status.schema.ts` — `ORDER_STATUS_SCHEMA`
  (`pending`, `confirmed`, `shipped`, `delivered`, `cancelled`) and `OrderStatus`.
- `src/features/orders/order-status.ts` — `ORDER_STATUS`: status → label and badge
  variant (`warning`, `info`, `secondary`, `success`, `destructive`).
- `src/features/orders/components/order-status-badge.tsx` — `OrderStatusBadge`,
  exported from `index.ts`. Tested in `order-status-badge.test.tsx`.

---

## Remaining

- Everything in Planned.

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

None yet; see Planned.

---

## Files

```text
src/features/orders/                     planned
src/routes/_dashboard/orders/            planned
```

---

## Future context

None.
