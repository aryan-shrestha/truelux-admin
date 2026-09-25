# Dashboard

Status: Implemented

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

## Implemented

- `app/(admin)/page.tsx` — one `GET /admin/dashboard/` feeding five sections.
- `components/dashboard/KpiCards.tsx` — revenue today, last 7 and 30 days, and
  awaiting action (`pending` + `confirmed`), each with a link to the orders list
  filtered by the matching date range or statuses.
- `components/dashboard/SalesChart.tsx` — shadcn `chart` area chart of revenue per day;
  the tooltip shows the formatted amount and the order count. `toSalesPoints` is the
  only place an amount becomes a number, through `toChartNumber`.
- `components/dashboard/StatusSummary.tsx` — a linked `badge` per status with its
  count, to `/orders?status=…`.
- `components/dashboard/RecentOrders.tsx` — the five recent orders, linked to their
  detail page, with an `empty` state.
- `components/dashboard/LowStockTable.tsx` — up to ten variants, linked to the
  product's Variants tab, with `Out` for zero stock and an `empty` state.

---

## Remaining

- Not yet exercised against the live API; verified with fixtures only.

---

## Decisions

### Decision: date-range links are Kathmandu calendar days

**Decision**

The KPI links send `from`/`to` as `Asia/Kathmandu` dates (`today`, `today − 6`,
`today − 29`).

**Reason**

The API buckets revenue by `created_at` in `Asia/Kathmandu`, so the list the card
links to covers the same days as the number on the card.

**Consequence**

It assumes `created_before` is inclusive of the day it names (see
[backend-api.md](../integrations/backend-api.md#open-questions)).

---

## Gotchas

- The Y axis uses compact Indian notation (`1.2L`) on a number. It is axis geometry,
  not an amount shown as money; the tooltip shows the API's string.
- The awaiting-action figure is a sum of two order counts, not money.

---

## Routes

```text
/    dynamic (cookies)
```

---

## API

### Calls

```text
GET /api/v1/admin/dashboard/    server, no-store
```

### Errors handled

Any failure reaches `app/(admin)/error.tsx`.

---

## State and data

None.

---

## Accessibility

- Each KPI link names its destination ("Today's orders"), not "View".
- Status badges are links with the status name and count in the accessible name.

---

## Tests

- `components/dashboard/dashboard.test.tsx` — the KPI cards render the API strings
  formatted and link awaiting action to `status=pending&status=confirmed`; the chart
  gets 30 points with the right number and label; both empty states; a low-stock row
  links to its product's variants tab.
- `lib/format/money.test.ts` — `toChartNumber`.

---

## Files

```text
app/(admin)/page.tsx
components/dashboard/
lib/api/dashboard.ts
```
