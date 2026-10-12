import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { BRAND, CATEGORY, catalogueHandlers, SHADE, SIZE } from "@/test/catalogue";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { chooseRowAction } from "@/test/row-menu";
import { meHandler } from "@/test/staff";

const PRODUCT_ID = "0d000000-0000-4000-8000-000000000001";
const VARIANT_ID = "0e000000-0000-4000-8000-000000000001";
const ORDER_ID = "6f1d2c3b-4a5e-4f60-8a7b-9c0d1e2f3a4b";

function product(stock = 12) {
  return {
    id: PRODUCT_ID,
    name: "Silk Foundation",
    slug: "silk-foundation",
    description: "",
    brand: { id: BRAND.id, name: BRAND.name, slug: BRAND.slug },
    category: { id: CATEGORY.id, name: CATEGORY.name, slug: CATEGORY.slug },
    base_price: "3200.00",
    is_published: true,
    sort_order: 0,
    skin_types: [],
    skin_feel: "",
    key_ingredients: "",
    variants: [
      {
        id: VARIANT_ID,
        sku: "LUM-SF-30-WB",
        size: { id: SIZE.id, name: SIZE.name },
        shade: { id: SHADE.id, name: SHADE.name, hex_code: SHADE.hex_code },
        stock_quantity: stock,
        price_override: null,
        price: "3200.00",
        compare_at_price: null,
        on_sale: false,
        discount_percent: null,
      },
    ],
    images: [],
    created_at: "2026-09-01T09:00:00Z",
    updated_at: "2026-09-01T09:00:00Z",
  };
}

function movement(overrides: Record<string, unknown>) {
  return {
    id: crypto.randomUUID(),
    variant_id: VARIANT_ID,
    sku: "LUM-SF-30-WB",
    reason: "received",
    quantity_change: 6,
    balance_after: 18,
    order_id: null,
    order_number: null,
    actor_email: "asha@truelux.test",
    note: "",
    created_at: "2026-10-09T10:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(meHandler, ...catalogueHandlers);
});

afterEach(() => localStorage.clear());

async function openStockDialog() {
  const user = userEvent.setup();
  await chooseRowAction(user, "LUM-SF-30-WB", "Change stock");
  const dialog = await screen.findByRole("dialog");
  return { user, dialog };
}

async function choose(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  option: string,
) {
  await user.click(within(dialog).getByLabelText("What happened"));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("changing stock", () => {
  it("records a removal as a negative adjustment with its reason and note", async () => {
    let stock = 12;
    let sentBody: unknown;
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => HttpResponse.json(product(stock))),
      http.post(`*/api/v1/admin/variants/${VARIANT_ID}/stock-adjustments/`, async ({ request }) => {
        sentBody = await request.json();
        stock = 10;
        return HttpResponse.json(movement({ reason: "damaged", quantity_change: -2 }), {
          status: 201,
        });
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);
    const { user, dialog } = await openStockDialog();

    await choose(user, dialog, "Damaged (removes)");
    await user.type(within(dialog).getByLabelText("How many"), "2");
    await user.type(within(dialog).getByLabelText("Note"), "Box crushed");
    await user.click(within(dialog).getByRole("button", { name: "Save change" }));

    expect(await screen.findByText("Stock of LUM-SF-30-WB changed")).toBeInTheDocument();
    expect(sentBody).toEqual({ reason: "damaged", quantity_change: -2, note: "Box crushed" });
    const row = screen.getByRole("cell", { name: "LUM-SF-30-WB" }).closest("tr") as HTMLElement;
    expect(await within(row).findByRole("cell", { name: "10" })).toBeInTheDocument();
  });

  it("sends a count as the variant's absolute stock, without a note", async () => {
    let sentBody: unknown;
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => HttpResponse.json(product())),
      http.patch(`*/api/v1/admin/variants/${VARIANT_ID}/`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(product(9).variants[0]);
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);
    const { user, dialog } = await openStockDialog();

    await choose(user, dialog, "Counted the shelf (sets the total)");
    expect(within(dialog).queryByLabelText("Note")).not.toBeInTheDocument();
    expect(within(dialog).getByText(/a sale made since you counted is lost/)).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText("How many are on the shelf"), "9");
    await user.click(within(dialog).getByRole("button", { name: "Save change" }));

    await screen.findByText("Stock of LUM-SF-30-WB changed");
    expect(sentBody).toEqual({ stock_quantity: 9 });
  });

  it("puts the API's quantity error on How many", async () => {
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => HttpResponse.json(product(2))),
      http.post(`*/api/v1/admin/variants/${VARIANT_ID}/stock-adjustments/`, () =>
        HttpResponse.json(
          {
            error: {
              code: "validation_error",
              message: "Only 2 in stock.",
              details: { quantity_change: ["Only 2 in stock."] },
            },
          },
          { status: 400 },
        ),
      ),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);
    const { user, dialog } = await openStockDialog();

    await choose(user, dialog, "Damaged (removes)");
    await user.type(within(dialog).getByLabelText("How many"), "3");
    await user.click(within(dialog).getByRole("button", { name: "Save change" }));

    expect(await within(dialog).findByText("Only 2 in stock.")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("How many")).toHaveAttribute("aria-invalid", "true");
  });

  it("sends nothing until a reason and at least 1 are given", async () => {
    let requests = 0;
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => HttpResponse.json(product())),
      http.post(`*/api/v1/admin/variants/${VARIANT_ID}/stock-adjustments/`, () => {
        requests += 1;
        return HttpResponse.json(movement({}), { status: 201 });
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);
    const { user, dialog } = await openStockDialog();

    await user.click(within(dialog).getByRole("button", { name: "Save change" }));
    expect(await within(dialog).findByText("Choose what happened.")).toBeInTheDocument();
    await choose(user, dialog, "Received from a supplier (adds)");
    await user.type(within(dialog).getByLabelText("How many"), "0");
    await user.click(within(dialog).getByRole("button", { name: "Save change" }));

    expect(await within(dialog).findByText("Enter at least 1.")).toBeInTheDocument();
    expect(requests).toBe(0);
  });
});

describe("stock history", () => {
  it("lists signed changes, links sales to their order and names who made them", async () => {
    const user = userEvent.setup();
    let requestedVariant: string | null = null;
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => HttpResponse.json(product())),
      http.get("*/api/v1/admin/stock-movements/", ({ request }) => {
        requestedVariant = new URL(request.url).searchParams.get("variant");
        return HttpResponse.json({
          count: 120,
          next: null,
          previous: null,
          results: [
            movement({ reason: "received", quantity_change: 6, note: "Delivery #12" }),
            movement({
              reason: "sale",
              quantity_change: -2,
              balance_after: 12,
              order_id: ORDER_ID,
              order_number: "TL-2026-000123",
              actor_email: null,
            }),
          ],
        });
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    await chooseRowAction(user, "LUM-SF-30-WB", "Stock history");

    const sheet = await screen.findByRole("dialog");
    expect(await within(sheet).findByText("+6")).toBeInTheDocument();
    expect(within(sheet).getByText("-2")).toBeInTheDocument();
    expect(within(sheet).getByText("Delivery #12")).toBeInTheDocument();
    expect(within(sheet).getByRole("link", { name: "TL-2026-000123" })).toHaveAttribute(
      "href",
      `/orders/${ORDER_ID}`,
    );
    expect(within(sheet).getByText("Customer")).toBeInTheDocument();
    expect(within(sheet).getByText("asha@truelux.test")).toBeInTheDocument();
    expect(within(sheet).getByText("Showing the latest 2 of 120 changes.")).toBeInTheDocument();
    expect(requestedVariant).toBe(VARIANT_ID);
  });

  it("says when a variant has no stock changes yet", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => HttpResponse.json(product())),
      http.get("*/api/v1/admin/stock-movements/", () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] }),
      ),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    await chooseRowAction(user, "LUM-SF-30-WB", "Stock history");

    expect(await screen.findByText("No stock changes yet")).toBeInTheDocument();
  });
});
