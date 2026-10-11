import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { shopDaysAgo } from "@/lib/date";
import { saveSession } from "@/lib/repositories/session";
import { dashboardHandler } from "@/test/dashboard";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { meHandler } from "@/test/staff";

const FIGURES = {
  orders_by_status: { pending: 4, confirmed: 2, shipped: 3, delivered: 40, cancelled: 1 },
  revenue: { today: "5400.00", last_7_days: "48200.00", last_30_days: "190350.00" },
  recent_orders: [
    {
      id: "6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b",
      order_number: "TL-2026-000123",
      status: "pending",
      full_name: "Sita Sharma",
      phone: "9800000000",
      total: "5550.00",
      item_count: 3,
      created_at: "2026-09-24T09:30:00Z",
    },
  ],
  low_stock: [
    {
      variant_id: "0c1d2e3f-4a5b-4c6d-8e7f-901a2b3c4d5e",
      product_id: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
      product_name: "Silk Foundation",
      sku: "LUM-SF-30-WB",
      size: "30 ml",
      shade: "Warm Beige",
      stock_quantity: 0,
    },
    {
      variant_id: "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
      product_id: "3c4d5e6f-7a8b-4c9d-8e0f-2a3b4c5d6e7f",
      product_name: "Rose Toner",
      sku: "LUM-RT-100",
      size: "100 ml",
      shade: null,
      stock_quantity: 2,
    },
  ],
};

function emptyOrderPage() {
  return http.get("*/api/v1/admin/orders/", () =>
    HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
  );
}

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(meHandler);
});

afterEach(() => localStorage.clear());

describe("dashboard", () => {
  it("shows the API's revenue formatted, and pending plus confirmed as awaiting", async () => {
    server.use(dashboardHandler(FIGURES));

    renderApp("/");

    expect(await screen.findByText("Rs 5,400.00")).toBeInTheDocument();
    expect(screen.getByText("Rs 48,200.00")).toBeInTheDocument();
    expect(screen.getByText("Rs 1,90,350.00")).toBeInTheDocument();
    const awaiting = screen.getByText("Awaiting action").closest("[data-slot=card]");
    expect(within(awaiting as HTMLElement).getByText("6")).toBeInTheDocument();
  });

  it("opens the pending and confirmed queue from the awaiting-action card", async () => {
    const user = userEvent.setup();
    server.use(dashboardHandler(FIGURES), emptyOrderPage());
    const { router } = renderApp("/");

    await user.click(await screen.findByRole("link", { name: "Pending and confirmed" }));

    await vi.waitFor(() =>
      expect(router.state.location.search).toEqual({ status: ["pending", "confirmed"] }),
    );
    expect(router.state.location.pathname).toBe("/orders");
  });

  it("opens today's orders from the revenue card", async () => {
    const user = userEvent.setup();
    server.use(dashboardHandler(FIGURES), emptyOrderPage());
    const { router } = renderApp("/");

    await user.click(await screen.findByRole("link", { name: "Today's orders" }));

    await vi.waitFor(() =>
      expect(router.state.location.search).toEqual({ from: shopDaysAgo(0), to: shopDaysAgo(0) }),
    );
  });

  it("opens one status's queue from its count", async () => {
    const user = userEvent.setup();
    server.use(dashboardHandler(FIGURES), emptyOrderPage());
    const { router } = renderApp("/");

    await user.click(await screen.findByRole("link", { name: "Cancelled 1" }));

    await vi.waitFor(() => expect(router.state.location.search).toEqual({ status: ["cancelled"] }));
  });

  it("lists recent orders and low stock, with Out at zero", async () => {
    server.use(dashboardHandler(FIGURES));

    renderApp("/");

    expect(await screen.findByRole("link", { name: "TL-2026-000123" })).toHaveAttribute(
      "href",
      "/orders/6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b",
    );
    const outRow = screen.getByRole("row", { name: /LUM-SF-30-WB/ });
    expect(within(outRow).getByRole("link", { name: "Silk Foundation" })).toHaveAttribute(
      "href",
      "/products/1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d?tab=variants",
    );
    expect(within(outRow).getByText("30 ml, Warm Beige")).toBeInTheDocument();
    expect(within(outRow).getByText("Out")).toBeInTheDocument();
    const lowRow = screen.getByRole("row", { name: /LUM-RT-100/ });
    expect(within(lowRow).getByText("100 ml")).toBeInTheDocument();
    expect(within(lowRow).getByText("2")).toBeInTheDocument();
  });

  it("explains an empty order history and healthy stock", async () => {
    server.use(dashboardHandler());

    renderApp("/");

    expect(await screen.findByText("No orders yet")).toBeInTheDocument();
    expect(screen.getByText("Stock is healthy")).toBeInTheDocument();
  });
});
