import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { meHandler } from "@/test/staff";

function listItem(number: string, status = "pending") {
  return {
    id: crypto.randomUUID(),
    order_number: number,
    status,
    full_name: "Sita Sharma",
    phone: "9800000000",
    total: "190350.00",
    item_count: 3,
    created_at: "2026-09-24T09:30:00Z",
  };
}

function orderPage(results: unknown[], count = results.length) {
  return { count, next: null, previous: null, results };
}

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(meHandler);
});

afterEach(() => localStorage.clear());

describe("orders list", () => {
  it("shows each order with its formatted total and status", async () => {
    server.use(
      http.get("*/api/v1/admin/orders/", () =>
        HttpResponse.json(orderPage([listItem("TL-2026-000123", "shipped")])),
      ),
    );

    renderApp("/orders");

    const row = (await screen.findByRole("link", { name: "TL-2026-000123" })).closest("tr");
    expect(row).not.toBeNull();
    expect(within(row as HTMLElement).getByText("Rs 1,90,350.00")).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText("Shipped")).toBeInTheDocument();
  });

  it("sends the URL's filters to the API in its own terms", async () => {
    let sentSearch = "";
    server.use(
      http.get("*/api/v1/admin/orders/", ({ request }) => {
        sentSearch = new URL(request.url).search;
        return HttpResponse.json(orderPage([]));
      }),
    );

    renderApp(
      "/orders?status=confirmed&status=pending&q=sita&from=2026-09-01&to=2026-09-30&page=2",
    );

    await screen.findByText("No orders match these filters");
    expect(new URLSearchParams(sentSearch).getAll("status")).toEqual(["pending", "confirmed"]);
    expect(Object.fromEntries(new URLSearchParams(sentSearch))).toMatchObject({
      search: "sita",
      created_after: "2026-09-01",
      created_before: "2026-09-30",
      limit: "25",
      offset: "25",
    });
  });

  it("filters by status from the tabs and starts again from the first page", async () => {
    const user = userEvent.setup();
    const requestedStatuses: string[][] = [];
    server.use(
      http.get("*/api/v1/admin/orders/", ({ request }) => {
        requestedStatuses.push(new URL(request.url).searchParams.getAll("status"));
        return HttpResponse.json(orderPage([listItem("TL-2026-000123")]));
      }),
    );
    const { router } = renderApp("/orders?page=2");
    await screen.findByRole("link", { name: "TL-2026-000123" });

    await user.click(screen.getByRole("tab", { name: "Pending" }));

    await vi.waitFor(() => expect(router.state.location.search).toEqual({ status: ["pending"] }));
    expect(requestedStatuses.at(-1)).toEqual(["pending"]);
  });

  it("keeps the current rows on screen while the next page loads", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("*/api/v1/admin/orders/", async ({ request }) => {
        if (new URL(request.url).searchParams.get("offset") === "25") {
          await delay(200);
          return HttpResponse.json(orderPage([listItem("TL-2026-000200")], 30));
        }
        return HttpResponse.json(orderPage([listItem("TL-2026-000100")], 30));
      }),
    );
    renderApp("/orders");
    await screen.findByRole("link", { name: "TL-2026-000100" });

    await user.click(screen.getByRole("link", { name: "Next page" }));

    expect(screen.getByRole("link", { name: "TL-2026-000100" })).toBeInTheDocument();
    expect(screen.getAllByRole("rowgroup")[1]).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("link", { name: "TL-2026-000200" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "TL-2026-000100" })).not.toBeInTheDocument();
  });

  it("says when there are no orders at all", async () => {
    server.use(http.get("*/api/v1/admin/orders/", () => HttpResponse.json(orderPage([]))));

    renderApp("/orders");

    expect(await screen.findByText("No orders yet")).toBeInTheDocument();
  });
});
