# Orders

Status: Implemented

Last updated: 2026-09-28

---

## Goal

Let the merchant work the COD order queue: confirm, ship, deliver or cancel.

---

## Scope

What is included in this implementation?

- `/orders`: a server-paginated `data-table` of number, date, customer, phone,
  units, total and a status `badge`.
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

- `app/(admin)/orders/page.tsx` — prefetches the list for the URL's filters and
  renders `OrdersView`, which reads `orderQueries.list(filters)` (`live`: polls every 60 s)
  and is the paginated list (25 a page) from URL state:
  `StatusTabs` (`?status=`, repeatable), `UrlSearch` (`?q=`), `DateRangeFilter`
  (`?from=`/`?to=`, ISO dates) and `TablePagination` (`?page=`).
- `components/orders/OrdersTable.tsx` — number (linked), placed date and time in
  Nepal time, customer, phone, units (`item_count`, the sum of quantities), total and a status `badge`; filtered and
  unfiltered empty states.
- `components/orders/StatusTabs.tsx` — All plus one tab per status. A URL with two or
  more statuses (the dashboard's awaiting-action link) selects no tab. On a narrow
  screen the tab list keeps its full width and scrolls inside a wrapper.
- `components/orders/DateRangeFilter.tsx` — `popover` + two-month `calendar` in range
  mode; writes the URL once both ends are chosen; a clear button; future days
  disabled.
- `app/(admin)/orders/[id]/page.tsx` — `findOrder` (`not_found` → `notFound()`),
  seeds `orderQueries.detail(id)`, renders `OrderView`: header with the status and
  the actions,
  `OrderItemsCard` (lines with unit price, quantity and line total; subtotal,
  shipping and total from the API) and `CustomerCard` (name, `tel:` phone, email,
  address, placed, payment method, note). `not_found` becomes `notFound()`. The
  grid is `grid-cols-1` below `xl`, so on a phone the items table scrolls inside its
  card instead of widening the page.
- `components/orders/OrderActions.tsx` — one button per entry in
  `allowed_transitions`: Confirm order, Mark as shipped, Mark as delivered; Cancel
  order sits behind an `alert-dialog` that says the items go back into stock.
- `lib/orders/actions.ts` — `moveOrder` validates the target and posts the
  transition.
- `components/orders/OrderActions.tsx` runs it in `useMutation`: the returned order is
  written into its detail key, and order lists and the dashboard are invalidated.
- `lib/orders/queries.ts` — `orderKeys`, `orderQueries`; `app/api/orders/route.ts`
  and `app/api/orders/[id]/route.ts` serve the browser's refetches.
- `lib/orders/status.ts` — the one map of status → label and badge variant, and the
  transition button labels. `OrderStatusBadge` is the only renderer.
- `lib/orders/query.ts` — URL ↔ API query mapping for the list and the dashboard's
  links.

---

## Remaining

- The date filter and the dashboard's links send Nepal calendar dates, but the API
  compares the UTC date of `created_at`, so a filtered list misses orders placed
  00:00–05:45 Nepal time on its first day and includes the same window after its
  last. Raised with the backend in
  [backend-api.md](../integrations/backend-api.md#open-questions).

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
toasted. The detail refetches on focus once stale.

---

## Gotchas

- Totals are displayed, never computed: the footer shows the API's `subtotal`,
  `shipping_fee` and `total`.
- `variant_shade` is an empty string, not `null`, for a shadeless line.
- Order numbers are `TL-<year>-<6 digits>`, with gaps.
- `payment_method` is only ever `cod`, shown as "Cash on delivery".
- `created_after` and `created_before` are both inclusive.
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
GET  /api/v1/admin/orders/                  server render; browser via /api/orders, polls 60 s
GET  /api/v1/admin/orders/{id}/             server render; browser via /api/orders/[id]
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

- URL: status, search, date range, page (History API).
- Query cache: `["orders","list",filters]`, `["orders","detail",id]`.
- React state: the date picker's in-progress range.

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
