# Dashboard

Status: Planned

Last updated: 2026-09-25

---

## Goal

Show the merchant, at a glance, what needs doing today and how the shop is trading.

---

## Scope

What is included in this implementation?

- KPI `card`s: revenue today, last 7 days and last 30 days, plus orders awaiting
  action (`pending` + `confirmed`), each linking to the filtered orders list
- A 30-day sales chart (shadcn `chart`, an area or bar chart of revenue, with the
  order count in the tooltip)
- Orders by status: `badge` counts linking to `/orders?status=…`
- Recent orders: a `table` of 5 rows linking to the order detail
- Low stock: a `table` of up to 10 variants (product, SKU, size/shade, stock) linking
  to the product edit page

---

## Context

`GET /api/v1/admin/dashboard/` (backend `admin-api.md`). All money values are decimal
strings, formatted only by `lib/format/money.ts` (ADR 0003). For the chart, the one
permitted parse into a number is `money.ts`'s `toChartNumber`.

---

## Tests

To be written:

- The KPI cards render the formatted API strings.
- An empty state for no orders and for no low stock.
- The chart receives 30 points.
