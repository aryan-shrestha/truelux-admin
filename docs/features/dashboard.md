# Dashboard

Status: Planned

Last updated: 2026-10-11

---

## Goal

Show the merchant, at a glance, what needs doing today and how the shop is trading.

---

## Scope

What is included in this implementation?

- KPI `card`s: revenue today, last 7 days and last 30 days, and orders awaiting
  action (`pending` + `confirmed`), each linking to the matching filtered orders list
- A 30-day sales chart (shadcn `chart`, an area chart of revenue per day, with the
  order count in the tooltip)
- Orders by status: a linked `badge` per status with its count, to
  `/orders?status=…`
- Recent orders: a `table` of the 5 latest, linked to the order
- Low stock: a `table` of up to 10 variants (product, SKU, size/shade, stock), linked
  to the product's Variants tab, `Out` at zero
- Empty states for recent orders and low stock

What is explicitly outside the scope?

- Custom date ranges or comparisons; the API returns fixed windows

---

## Context

- Requirements ported from `../admin/docs/features/dashboard.md` (Implemented there).
- API: `GET /api/v1/admin/dashboard/`, `back-end/docs/features/admin-api.md`
  § Dashboard. Revenue buckets are `Asia/Kathmandu` days; `sales_by_day` is 30
  zero-filled entries, oldest first; `low_stock` is at most 10 variants at or below 5.
- Money is a decimal string and is never added or compared here
  ([../convention.md](../convention.md#other-conventions)).
- Depends on [staff-auth.md](staff-auth.md), [tanstack-query.md](tanstack-query.md)
  (`live` freshness) and the orders feature's `OrderStatusBadge`
  ([app-shell.md](app-shell.md)).

---

## Planned

- `src/features/dashboard/` — `dashboard.repository.ts` (`getDashboard`),
  `dashboard.schema.ts`, `dashboard.queries.ts` (`["dashboard"]`, `live`: polled every
  60 s while visible, refetched on focus).
- `src/routes/_dashboard/index.tsx` — the loader ensures the query; the page composes
  the five sections.
- Add `dashboardKeys.all` to `useTransitionOrder`'s `meta.invalidates` in
  `src/features/orders/queries/orders.mutations.ts` (export the keys from the
  dashboard's `index.ts`): an order move changes the KPIs and the status counts.
- The route sets its own `pendingComponent`, a skeleton shaped like these sections.
  The router's default `PageSkeleton` ([app-shell.md](app-shell.md)) is a generic
  header, KPI row and table, and does not match the dashboard's layout.
- `components/kpi-cards.tsx` — the four cards. Links use `Asia/Kathmandu` dates
  (`today`, `today − 6`, `today − 29`) as `?from=`/`?to=`; awaiting action links to
  `?status=pending&status=confirmed`. Each link names its destination ("Today's
  orders"), not "View".
- `components/sales-chart.tsx` — area chart; the tooltip shows the API's amount
  string formatted and the order count. The one conversion of an amount to a number,
  for chart geometry only, goes through the money module's `toChartNumber`.
- `components/status-summary.tsx`, `recent-orders.tsx`, `low-stock-table.tsx`.
- Add the shadcn `chart` component (Recharts) and port
  `../admin/lib/format/money.ts` (`formatMoney`, `toChartNumber`) to `src/lib/money.ts`.
- A failed poll keeps the last figures and toasts once
  ([tanstack-query.md](tanstack-query.md)).

Planned tests: the cards render the API's strings formatted; awaiting action links to
both statuses; the chart gets 30 points with the right values and labels; both empty
states; a low-stock row links to its product's Variants tab; `toChartNumber`.

---

## Implemented

- `src/routes/_dashboard/index.tsx` — a placeholder `PageHeader` only.

---

## Remaining

- Everything in Planned.

---

## Decisions

### Decision: date-range links are Kathmandu calendar days

**Decision**

The KPI links send `from`/`to` as `Asia/Kathmandu` dates.

**Reason**

The API buckets revenue by Kathmandu day, and its `created_after`/`created_before`
filters now compare Kathmandu days too, so the linked list holds exactly the orders
the card counted.

**Consequence**

`../admin` documented a 5 h 45 m mismatch here because the API used to compare UTC
dates. The back-end has since fixed it (`admin-api.md` § Gotchas); there is nothing
to work around.

---

## Gotchas

- The Y axis may use compact Indian notation (`1.2L`) on a number: that is axis
  geometry, not an amount shown as money. The tooltip shows the API's string.
- The awaiting-action figure is a sum of two order counts, not money.
- `low_stock[].shade` is `null` for a shadeless variant.

---

## API

```text
GET /api/v1/admin/dashboard/
```

Response: `back-end/docs/features/admin-api.md` § Dashboard.

---

## Data changes

- Query key `["dashboard"]`, invalidated by order transitions and variant or stock
  changes.

---

## Permissions

Signed-in staff (the API).

---

## Tests

None yet; see Planned.

---

## Files

```text
src/routes/_dashboard/index.tsx
src/features/dashboard/        planned
src/lib/money.ts               planned
```

---

## Future context

None.
