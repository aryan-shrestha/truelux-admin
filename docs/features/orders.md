# Orders

Status: Implemented

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

---

## Implemented

- `app/(admin)/orders/page.tsx` — the paginated list (25 a page) from URL state:
  `StatusTabs` (`?status=`, repeatable), `UrlSearch` (`?q=`), `DateRangeFilter`
  (`?from=`/`?to=`, ISO dates) and `TablePagination` (`?page=`).
- `components/orders/OrdersTable.tsx` — number (linked), placed date and time in
  Nepal time, customer, phone, items, total and a status `badge`; filtered and
  unfiltered empty states.
- `components/orders/StatusTabs.tsx` — All plus one tab per status. A URL with two or
  more statuses (the dashboard's awaiting-action link) selects no tab.
- `components/orders/DateRangeFilter.tsx` — `popover` + two-month `calendar` in range
  mode; writes the URL once both ends are chosen; a clear button; future days
  disabled.
- `app/(admin)/orders/[id]/page.tsx` — header with the status and the actions,
  `OrderItemsCard` (lines with unit price, quantity and line total; subtotal,
  shipping and total from the API) and `CustomerCard` (name, `tel:` phone, email,
  address, placed, payment method, note). `not_found` becomes `notFound()`.
- `components/orders/OrderActions.tsx` — one button per entry in
  `allowed_transitions`: Confirm order, Mark as shipped, Mark as delivered; Cancel
  order sits behind an `alert-dialog` that says the items go back into stock.
- `lib/orders/actions.ts` — `moveOrder` validates the target, posts the transition
  and revalidates the order, the list and the dashboard.
- `lib/orders/status.ts` — the one map of status → label and badge variant, and the
  transition button labels. `OrderStatusBadge` is the only renderer.
- `lib/orders/query.ts` — URL ↔ API query mapping for the list and the dashboard's
  links.

---

## Remaining

- Not yet exercised against the live API; verified with stubs only.
- `created_before` is assumed inclusive of the day it names; see
  [backend-api.md](../integrations/backend-api.md#open-questions).
- `payment_method` is shown as "Cash on delivery" when it is `cod`, otherwise as sent;
  the contract does not list its values.

---

## Decisions

### Decision: the buttons come only from `allowed_transitions`

**Decision**

The detail page renders no transition the API did not list, and does not derive
the flow itself.

**Reason**

The services own the state machine; a second copy here would drift.

**Consequence**

A stale page can still send a transition the API has since refused; the 422 code is
toasted and the page revalidates on the next action.

---

## Gotchas

- Totals are displayed, never computed: the footer shows the API's `subtotal`,
  `shipping_fee` and `total`.
- `variant_shade` is an empty string, not `null`, for a shadeless line.
- The date filter's days are the picker's local calendar days; the dashboard's links
  use Kathmandu days. They agree for staff in Nepal.

---

## Routes

```text
/orders          dynamic; ?status (repeatable) ?q ?from ?to ?page
/orders/[id]     dynamic
```

---

## API

### Calls

```text
GET  /api/v1/admin/orders/                  server, no-store
GET  /api/v1/admin/orders/{id}/             server, no-store
POST /api/v1/admin/orders/{id}/transition/  server action
```

### Errors handled

| `code`                      | Treatment                                                           |
| --------------------------- | ------------------------------------------------------------------- |
| `invalid_status_transition` | Toast: "The order cannot move to that status from where it is now." |
| `order_already_shipped`     | Toast: "The order has already shipped…"                             |
| `order_not_cancellable`     | Toast: "Only pending or confirmed orders can be cancelled."         |
| `not_found` (read)          | `notFound()`                                                        |

---

## State and data

- URL: status, search, date range, page.
- React state: the date picker's in-progress range, pending transitions.

---

## Accessibility

- The date button's accessible name includes the current range.
- Status is always a word in the badge; colour is secondary.
- The phone number is a `tel:` link, for staff confirming orders from a phone.

---

## Tests

- `components/orders/OrderActions.test.tsx` — only allowed transitions render; none
  for a finished order; cancel needs the confirm that mentions stock; a 422 code's
  sentence is toasted.
- `lib/orders/query.test.ts` — repeated statuses, search and dates reach the API
  query; unknown statuses and bad dates are dropped; links round-trip; every status
  has a distinct badge.
- `lib/api/errors.test.ts` — the three transition codes map to their sentences.
- `tests/e2e/auth-orders.spec.ts` — Playwright: from the dashboard to the orders list
  and an order (needs `E2E_API`).

---

## Files

```text
app/(admin)/orders/
components/orders/
lib/orders/
lib/api/orders.ts
```
