import { http, HttpResponse } from "msw";

// `GET admin/dashboard/` for a shop with no orders yet; tests that need figures pass
// their own body.
export function dashboardHandler(overrides: Record<string, unknown> = {}) {
  const sales_by_day = Array.from({ length: 30 }, (_, index) => ({
    date: `2026-09-${String(index + 1).padStart(2, "0")}`,
    orders: 0,
    revenue: "0.00",
  }));
  return http.get("*/api/v1/admin/dashboard/", () =>
    HttpResponse.json({
      orders_by_status: { pending: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0 },
      revenue: { today: "0.00", last_7_days: "0.00", last_30_days: "0.00" },
      sales_by_day,
      recent_orders: [],
      low_stock: [],
      ...overrides,
    }),
  );
}
