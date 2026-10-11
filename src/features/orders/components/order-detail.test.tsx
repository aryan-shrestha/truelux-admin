import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { dashboardKeys } from "@/features/dashboard";
import { saveSession } from "@/lib/repositories/session";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { meHandler } from "@/test/staff";

const ORDER_ID = "6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b";
const DETAIL_PATH = `*/api/v1/admin/orders/${ORDER_ID}/`;

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: ORDER_ID,
    order_number: "TL-2026-000123",
    status: "pending",
    full_name: "Sita Sharma",
    phone: "9800000000",
    total: "5550.00",
    item_count: 3,
    created_at: "2026-09-24T09:30:00Z",
    email: "sita@example.test",
    address_line: "Jhamsikhel Road",
    city: "Lalitpur",
    district: "Lalitpur",
    note: "Call before delivery.",
    subtotal: "5400.00",
    shipping_fee: "150.00",
    payment_method: "cod",
    allowed_transitions: ["confirmed", "cancelled"],
    items: [
      {
        product_name: "Silk Foundation",
        sku: "LUM-SF-30-WB",
        variant_size: "30 ml",
        variant_shade: "Warm Beige",
        quantity: 2,
        unit_price: "2200.00",
        line_total: "4400.00",
      },
      {
        product_name: "Rose Toner",
        sku: "LUM-RT-100",
        variant_size: "100 ml",
        variant_shade: "",
        quantity: 1,
        unit_price: "1000.00",
        line_total: "1000.00",
      },
    ],
    ...overrides,
  };
}

function errorEnvelope(status: number, code: string) {
  return HttpResponse.json({ error: { code, message: code, details: {} } }, { status });
}

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(meHandler);
});

afterEach(() => localStorage.clear());

describe("order detail", () => {
  it("shows the items and the API's totals, customer and note", async () => {
    server.use(http.get(DETAIL_PATH, () => HttpResponse.json(order())));

    renderApp(`/orders/${ORDER_ID}`);

    expect(await screen.findByRole("heading", { name: "TL-2026-000123" })).toBeInTheDocument();
    expect(screen.getByText("30 ml, Warm Beige")).toBeInTheDocument();
    expect(screen.getByText("100 ml")).toBeInTheDocument();
    expect(screen.getByText("Rs 5,400.00")).toBeInTheDocument();
    expect(screen.getByText("Rs 150.00")).toBeInTheDocument();
    expect(screen.getByText("Rs 5,550.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "9800000000" })).toHaveAttribute(
      "href",
      "tel:9800000000",
    );
    expect(screen.getByText("Call before delivery.")).toBeInTheDocument();
  });

  it("shows the not-found page for an order that does not exist", async () => {
    server.use(http.get(DETAIL_PATH, () => errorEnvelope(404, "not_found")));

    renderApp(`/orders/${ORDER_ID}`);

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});

describe("order actions", () => {
  it("offers only the transitions the API allows", async () => {
    server.use(http.get(DETAIL_PATH, () => HttpResponse.json(order())));

    renderApp(`/orders/${ORDER_ID}`);

    expect(await screen.findByRole("button", { name: "Confirm order" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel order" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark as shipped" })).not.toBeInTheDocument();
  });

  it("offers nothing for a finished order", async () => {
    server.use(
      http.get(DETAIL_PATH, () =>
        HttpResponse.json(order({ status: "delivered", allowed_transitions: [] })),
      ),
    );

    renderApp(`/orders/${ORDER_ID}`);

    await screen.findByRole("heading", { name: "TL-2026-000123" });
    expect(screen.queryByRole("button", { name: /order|Mark as/ })).not.toBeInTheDocument();
  });

  it("shows the order the API returns after a move, without fetching it again", async () => {
    const user = userEvent.setup();
    let detailRequests = 0;
    let sentBody: unknown;
    server.use(
      http.get(DETAIL_PATH, () => {
        detailRequests += 1;
        return HttpResponse.json(order());
      }),
      http.post(`${DETAIL_PATH}transition/`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(
          order({ status: "confirmed", allowed_transitions: ["shipped", "cancelled"] }),
        );
      }),
    );
    renderApp(`/orders/${ORDER_ID}`);

    await user.click(await screen.findByRole("button", { name: "Confirm order" }));

    expect(await screen.findByRole("button", { name: "Mark as shipped" })).toBeInTheDocument();
    expect(screen.getByText("TL-2026-000123 is now confirmed")).toBeInTheDocument();
    expect(sentBody).toEqual({ to: "confirmed" });
    expect(detailRequests).toBe(1);
  });

  it("marks the dashboard stale after a move", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(DETAIL_PATH, () => HttpResponse.json(order())),
      http.post(`${DETAIL_PATH}transition/`, () =>
        HttpResponse.json(order({ status: "confirmed", allowed_transitions: ["shipped"] })),
      ),
    );
    const { queryClient } = renderApp(`/orders/${ORDER_ID}`);
    queryClient.setQueryData(dashboardKeys.all, { cached: true });

    await user.click(await screen.findByRole("button", { name: "Confirm order" }));

    await screen.findByRole("button", { name: "Mark as shipped" });
    expect(queryClient.getQueryState(dashboardKeys.all)?.isInvalidated).toBe(true);
  });

  it("cancels only after the confirmation that the items go back into stock", async () => {
    const user = userEvent.setup();
    const sentBodies: unknown[] = [];
    server.use(
      http.get(DETAIL_PATH, () => HttpResponse.json(order())),
      http.post(`${DETAIL_PATH}transition/`, async ({ request }) => {
        sentBodies.push(await request.json());
        return HttpResponse.json(order({ status: "cancelled", allowed_transitions: [] }));
      }),
    );
    renderApp(`/orders/${ORDER_ID}`);

    await user.click(await screen.findByRole("button", { name: "Cancel order" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("The items go back into stock.");
    expect(sentBodies).toEqual([]);
    await user.click(within(dialog).getByRole("button", { name: "Cancel order" }));

    expect(await screen.findByText("TL-2026-000123 is now cancelled")).toBeInTheDocument();
    expect(sentBodies).toEqual([{ to: "cancelled" }]);
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it.each([
    ["invalid_status_transition", "The order cannot move to that status from where it is now."],
    [
      "order_already_shipped",
      "The order has already shipped, so it can no longer be changed that way.",
    ],
    ["order_not_cancellable", "Only pending or confirmed orders can be cancelled."],
  ])("toasts the sentence for %s and refetches the order", async (code, sentence) => {
    const user = userEvent.setup();
    let detailRequests = 0;
    server.use(
      http.get(DETAIL_PATH, () => {
        detailRequests += 1;
        return HttpResponse.json(order());
      }),
      http.post(`${DETAIL_PATH}transition/`, () => errorEnvelope(422, code)),
    );
    renderApp(`/orders/${ORDER_ID}`);

    await user.click(await screen.findByRole("button", { name: "Confirm order" }));

    expect(await screen.findByText(sentence)).toBeInTheDocument();
    await vi.waitFor(() => expect(detailRequests).toBe(2));
  });
});
