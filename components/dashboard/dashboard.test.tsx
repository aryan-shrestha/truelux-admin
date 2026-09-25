import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { KpiCards } from "@/components/dashboard/KpiCards";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { toSalesPoints } from "@/components/dashboard/SalesChart";
import { dashboard } from "@/tests/fixtures/orders";

describe("KpiCards", () => {
  it("shows the API's amounts formatted, and pending plus confirmed as awaiting", () => {
    render(<KpiCards revenue={dashboard.revenue} ordersByStatus={dashboard.orders_by_status} />);

    expect(screen.getByText("Rs 5,400.00")).toBeInTheDocument();
    expect(screen.getByText("Rs 48,200.00")).toBeInTheDocument();
    expect(screen.getByText("Rs 1,90,350.00")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
  });

  it("links awaiting action to the pending and confirmed queue", () => {
    render(<KpiCards revenue={dashboard.revenue} ordersByStatus={dashboard.orders_by_status} />);

    expect(screen.getByRole("link", { name: "Pending and confirmed" })).toHaveAttribute(
      "href",
      "/orders?status=pending&status=confirmed",
    );
  });
});

describe("toSalesPoints", () => {
  it("gives the chart one point per day for all 30 days", () => {
    const points = toSalesPoints(dashboard.sales_by_day);

    expect(points).toHaveLength(30);
    expect(points[1]).toMatchObject({ day: "2 Aug", revenue: 3200, revenueLabel: "Rs 3,200.00" });
  });
});

describe("empty states", () => {
  it("explains an empty order history", () => {
    render(<RecentOrders orders={[]} />);

    expect(screen.getByText("No orders yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("says stock is healthy when nothing is low", () => {
    render(<LowStockTable variants={[]} />);

    expect(screen.getByText("Stock is healthy")).toBeInTheDocument();
  });

  it("links a low-stock variant to its product's variants tab", () => {
    render(<LowStockTable variants={dashboard.low_stock} />);

    const row = screen.getByRole("row", { name: /LUM-SF-30-WB/ });
    expect(within(row).getByRole("link", { name: "Silk Foundation" })).toHaveAttribute(
      "href",
      "/products/p1?tab=variants",
    );
    expect(within(row).getByText("30 ml, Warm Beige")).toBeInTheDocument();
  });
});
