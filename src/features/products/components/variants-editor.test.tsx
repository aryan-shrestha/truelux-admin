import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { BRAND, CATEGORY, catalogueHandlers, SHADE, SIZE } from "@/test/catalogue";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { meHandler } from "@/test/staff";

const PRODUCT_ID = "0d000000-0000-4000-8000-000000000001";
const VARIANT_ID = "0e000000-0000-4000-8000-000000000001";
const PRODUCT_PATH = `*/api/v1/admin/products/${PRODUCT_ID}/`;

const SAVED_VARIANT = {
  id: VARIANT_ID,
  sku: "LUM-SF-30-WB",
  size: { id: SIZE.id, name: SIZE.name },
  shade: { id: SHADE.id, name: SHADE.name, hex_code: SHADE.hex_code },
  stock_quantity: 12,
  price_override: "2720.00",
  price: "2720.00",
  compare_at_price: null,
  on_sale: false,
  discount_percent: null,
};

function product(variants: unknown[] = [SAVED_VARIANT]) {
  return {
    id: PRODUCT_ID,
    name: "Silk Foundation",
    slug: "silk-foundation",
    description: "",
    brand: { id: BRAND.id, name: BRAND.name, slug: BRAND.slug },
    category: { id: CATEGORY.id, name: CATEGORY.name, slug: CATEGORY.slug },
    base_price: "3200.00",
    is_published: false,
    sort_order: 0,
    skin_types: [],
    skin_feel: "",
    key_ingredients: "",
    variants,
    images: [],
    created_at: "2026-09-01T09:00:00Z",
    updated_at: "2026-09-01T09:00:00Z",
  };
}

function errorEnvelope(status: number, code: string, details: Record<string, unknown> = {}) {
  return HttpResponse.json({ error: { code, message: code, details } }, { status });
}

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(meHandler, ...catalogueHandlers);
});

afterEach(() => localStorage.clear());

describe("variants", () => {
  it("opens on the tab in the URL and writes the tab back when switched", async () => {
    const user = userEvent.setup();
    server.use(http.get(PRODUCT_PATH, () => HttpResponse.json(product())));
    const { router } = renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    expect(await screen.findByLabelText("SKU of LUM-SF-30-WB")).toHaveValue("LUM-SF-30-WB");
    await user.click(screen.getByRole("tab", { name: "Details" }));

    await vi.waitFor(() => expect(router.state.location.search).toEqual({}));
    expect(screen.getByLabelText("Name")).toHaveValue("Silk Foundation");
  });

  it("shows a saved variant's stock read-only and saves only what changed", async () => {
    const user = userEvent.setup();
    let sentBody: unknown;
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product())),
      http.patch(`*/api/v1/admin/variants/${VARIANT_ID}/`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ ...SAVED_VARIANT, price_override: null, price: "3200.00" });
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);
    const save = await screen.findByRole("button", { name: "Save LUM-SF-30-WB" });

    expect(screen.queryByLabelText("Opening stock of LUM-SF-30-WB")).not.toBeInTheDocument();
    expect(save).toBeDisabled();
    await user.clear(screen.getByLabelText("Price override of LUM-SF-30-WB"));
    await user.click(save);

    expect(await screen.findByText("LUM-SF-30-WB saved")).toBeInTheDocument();
    expect(sentBody).toEqual({
      sku: "LUM-SF-30-WB",
      size_id: SIZE.id,
      shade_id: SHADE.id,
      price_override: null,
      compare_at_price: null,
    });
  });

  it("adds a new variant with its opening stock", async () => {
    const user = userEvent.setup();
    let sentBody: unknown;
    let isCreated = false;
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product(isCreated ? [SAVED_VARIANT] : []))),
      http.post(`${PRODUCT_PATH}variants/`, async ({ request }) => {
        sentBody = await request.json();
        isCreated = true;
        return HttpResponse.json(SAVED_VARIANT, { status: 201 });
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    await user.click(await screen.findByRole("button", { name: "Add variant" }));
    await user.type(screen.getByLabelText("SKU of new variant 1"), "LUM-SF-30-WB");
    await user.click(screen.getByLabelText("Size of new variant 1"));
    await user.click(await screen.findByRole("option", { name: SIZE.name }));
    await user.clear(screen.getByLabelText("Opening stock of new variant 1"));
    await user.type(screen.getByLabelText("Opening stock of new variant 1"), "12");
    await user.click(screen.getByRole("button", { name: "Add new variant 1" }));

    expect(await screen.findByText("LUM-SF-30-WB added")).toBeInTheDocument();
    expect(sentBody).toEqual({
      sku: "LUM-SF-30-WB",
      size_id: SIZE.id,
      shade_id: null,
      price_override: null,
      compare_at_price: null,
      stock_quantity: 12,
    });
    expect(await screen.findByLabelText("SKU of LUM-SF-30-WB")).toBeInTheDocument();
    expect(screen.queryByLabelText("SKU of new variant 1")).not.toBeInTheDocument();
  });

  it("discards a draft row without asking the API", async () => {
    const user = userEvent.setup();
    server.use(http.get(PRODUCT_PATH, () => HttpResponse.json(product([]))));
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    await user.click(await screen.findByRole("button", { name: "Add variant" }));
    await user.click(screen.getByRole("button", { name: "Discard new variant 1" }));

    expect(screen.queryByLabelText("SKU of new variant 1")).not.toBeInTheDocument();
    expect(screen.getByText("No variants yet")).toBeInTheDocument();
  });

  it("explains a duplicate SKU, or size and shade, on the row", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product())),
      http.patch(`*/api/v1/admin/variants/${VARIANT_ID}/`, () => errorEnvelope(409, "conflict")),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    await user.type(await screen.findByLabelText("SKU of LUM-SF-30-WB"), "-2");
    await user.click(screen.getByRole("button", { name: "Save LUM-SF-30-WB" }));

    expect(
      await screen.findByText("Another variant already has this SKU, or this size and shade."),
    ).toBeInTheDocument();
  });

  it("deletes only after the confirmation, and explains an ordered variant", async () => {
    const user = userEvent.setup();
    let deleteRequests = 0;
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product())),
      http.delete(`*/api/v1/admin/variants/${VARIANT_ID}/`, () => {
        deleteRequests += 1;
        return errorEnvelope(409, "conflict");
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    await user.click(await screen.findByRole("button", { name: "Delete LUM-SF-30-WB" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(deleteRequests).toBe(0);
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText("LUM-SF-30-WB has been ordered, so it cannot be deleted."),
    ).toBeInTheDocument();
    expect(deleteRequests).toBe(1);
    expect(screen.getByLabelText("SKU of LUM-SF-30-WB")).toBeInTheDocument();
  });

  it("shows the API's discount only on a variant it marks on sale", async () => {
    const onSale = {
      ...SAVED_VARIANT,
      id: "0e000000-0000-4000-8000-000000000002",
      sku: "LUM-SF-50-WB",
      compare_at_price: "3200.00",
      on_sale: true,
      discount_percent: 15,
    };
    server.use(http.get(PRODUCT_PATH, () => HttpResponse.json(product([SAVED_VARIANT, onSale]))));
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    const saleRow = (await screen.findByLabelText("SKU of LUM-SF-50-WB")).closest(
      "tr",
    ) as HTMLElement;
    const otherRow = screen.getByLabelText("SKU of LUM-SF-30-WB").closest("tr") as HTMLElement;

    expect(within(saleRow).getByText("−15%")).toBeInTheDocument();
    expect(within(otherRow).queryByText(/%$/)).not.toBeInTheDocument();
    expect(within(otherRow).getByLabelText("Compare-at price of LUM-SF-30-WB")).toHaveAttribute(
      "placeholder",
      "Not on sale",
    );
  });

  it("puts the API's compare-at error on the edited row only", async () => {
    const user = userEvent.setup();
    const second = {
      ...SAVED_VARIANT,
      id: "0e000000-0000-4000-8000-000000000002",
      sku: "LUM-SF-50-WB",
    };
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product([SAVED_VARIANT, second]))),
      http.patch(`*/api/v1/admin/variants/${second.id}/`, () =>
        errorEnvelope(400, "validation_error", {
          compare_at_price: ["Must be greater than the price."],
        }),
      ),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);
    const field = await screen.findByLabelText("Compare-at price of LUM-SF-50-WB");

    await user.type(field, "2000");
    await user.click(screen.getByRole("button", { name: "Save LUM-SF-50-WB" }));

    const secondRow = field.closest("tr") as HTMLElement;
    const firstRow = screen.getByLabelText("SKU of LUM-SF-30-WB").closest("tr") as HTMLElement;
    expect(
      await within(secondRow).findByText("Must be greater than the price."),
    ).toBeInTheDocument();
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(within(firstRow).queryByText("Must be greater than the price.")).not.toBeInTheDocument();
  });
});
