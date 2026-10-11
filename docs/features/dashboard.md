# Dashboard

Status: Implemented

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
- Low stock: a `table` of up to 10 variants (product, SKU, size/shade, stock), `Out`
  at zero. The product name links to the product's Variants tab once products exists
  ([products.md](products.md))
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

None.

---

## Implemented

- `src/features/dashboard/`:
  - `schemas/dashboard.schema.ts` — `DASHBOARD_SCHEMA`; `recent_orders` reuses the
    orders feature's `ORDER_LIST_ITEM_SCHEMA`
  - `repositories/dashboard.repository.ts` — `getDashboard`
  - `queries/dashboard.queries.ts` — `dashboardKeys.all` (`["dashboard"]`) and
    `dashboardQueries.dashboard()`, `live` (polled every 60 s while visible)
  - `components/kpi-cards.tsx` — revenue today, 7 and 30 days, and awaiting action
    (pending + confirmed, a count). Each links to the orders list with typed
    filters: `from`/`to` from `shopDaysAgo` (Kathmandu days), or
    `status: [pending, confirmed]`. Link text names the destination.
  - `components/sales-chart.tsx` + `sales-points.ts` — an area chart (shadcn
    `chart`, Recharts); `toSalesPoints` makes one point per day with
    `toChartNumber` for geometry and the API's amount, formatted, for the tooltip.
    Y ticks are compact numbers.
  - `components/status-summary.tsx` — a link per status to `/orders?status=…`,
    `OrderStatusBadge` plus the count
  - `components/recent-orders.tsx` — the five latest, linked to the order; empty state
  - `components/low-stock-table.tsx` — product (linked to its Variants tab), SKU,
    size and shade, stock as a badge (`Out` at zero); empty state ("Stock is
    healthy")
  - `components/dashboard-view.tsx`, `dashboard-skeleton.tsx` — the layout and a
    skeleton shaped like it
- `src/routes/_dashboard/index.tsx` — awaits the dashboard in the loader;
  `pendingComponent: DashboardSkeleton`.
- `src/features/orders/queries/orders.mutations.ts` — `useTransitionOrder`
  invalidates `dashboardKeys.all`.
- `src/lib/money.ts` — `toChartNumber`; `src/lib/date.ts` — `shopDaysAgo`.
- `package.json` — `"sideEffects": ["*.css"]` (see Gotchas).
- A failed poll keeps the last figures and toasts once, through the query cache's
  `onError` ([tanstack-query.md](tanstack-query.md)).

---

## Remaining

None.

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
- The orders and dashboard features import each other's `index.ts` (the dashboard
  renders `OrderStatusBadge`; an order move invalidates `dashboardKeys`). The cycle
  is safe because each uses the other's exports only inside components and hooks;
  never use one at a module's top level.
- Route loaders stay in the entry chunk and import feature barrels. Without
  `"sideEffects": ["*.css"]` in `package.json`, Rollup keeps every module a barrel
  re-exports, and Recharts, the calendar and every route landed in one 842 kB entry
  chunk. With it, Recharts loads only with this route. A module imported only for its
  side effects would now be dropped: import CSS that way, nothing else.

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

- `components/dashboard-view.test.tsx` — the API's revenue formatted and awaiting
  action as pending + confirmed; the awaiting card opens `/orders` with both
  statuses; the today card opens today's Kathmandu range; a status count opens its
  queue; recent orders link to the order; low stock shows size and shade and `Out` at
  zero; both empty states.
- `components/sales-points.test.ts` — 30 points; values and labels.
- `src/lib/money.test.ts` (`toChartNumber`), `src/lib/date.test.ts`
  (`shopDaysAgo` across the UTC/Kathmandu day boundary).
- `src/features/orders/components/order-detail.test.tsx` — a move marks the
  dashboard stale.
- `src/test/dashboard.ts` — a zero-figures `dashboardHandler` for any test that
  renders `/`.

---

## Files

```text
src/features/dashboard/
src/routes/_dashboard/index.tsx
src/lib/money.ts
src/lib/date.ts
src/test/dashboard.ts
```

---

## Future context

None.
