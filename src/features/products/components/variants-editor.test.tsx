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

function rowOf(sku: string) {
  return screen.getByRole("cell", { name: sku }).closest("tr") as HTMLElement;
}

async function openAction(user: ReturnType<typeof userEvent.setup>, sku: string, action: string) {
  await user.click(await screen.findByRole("button", { name: `Actions for ${sku}` }));
  await user.click(await screen.findByRole("menuitem", { name: action }));
}

describe("variants", () => {
  it("opens on the tab in the URL and writes the tab back when switched", async () => {
    const user = userEvent.setup();
    server.use(http.get(PRODUCT_PATH, () => HttpResponse.json(product())));
    const { router } = renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    expect(await screen.findByRole("cell", { name: "LUM-SF-30-WB" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Details" }));

    await vi.waitFor(() => expect(router.state.location.search).toEqual({}));
    expect(screen.getByLabelText("Name")).toHaveValue("Silk Foundation");
  });

  it("lists each variant as the API returned it, without inputs", async () => {
    server.use(http.get(PRODUCT_PATH, () => HttpResponse.json(product())));
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    await screen.findByRole("cell", { name: "LUM-SF-30-WB" });
    const row = rowOf("LUM-SF-30-WB");

    expect(within(row).getByRole("cell", { name: SIZE.name })).toBeInTheDocument();
    expect(within(row).getByRole("cell", { name: SHADE.name })).toBeInTheDocument();
    expect(within(row).getByRole("cell", { name: "12" })).toBeInTheDocument();
    expect(within(row).getByRole("cell", { name: "Rs 2,720.00" })).toBeInTheDocument();
    expect(within(row).queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("edits a saved variant in the sheet, without its stock", async () => {
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

    await openAction(user, "LUM-SF-30-WB", "Edit");
    const sheet = await screen.findByRole("dialog", { name: "Edit LUM-SF-30-WB" });
    expect(within(sheet).getByLabelText("SKU")).toHaveValue("LUM-SF-30-WB");
    expect(within(sheet).queryByLabelText("Opening stock")).not.toBeInTheDocument();
    await user.clear(within(sheet).getByLabelText("Price override"));
    await user.click(within(sheet).getByRole("button", { name: "Save variant" }));

    expect(await screen.findByText("LUM-SF-30-WB saved")).toBeInTheDocument();
    expect(sentBody).toEqual({
      sku: "LUM-SF-30-WB",
      size_id: SIZE.id,
      shade_id: SHADE.id,
      price_override: null,
      compare_at_price: null,
    });
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("adds a new variant with its opening stock from the sheet", async () => {
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
    const sheet = await screen.findByRole("dialog", { name: "New variant" });
    await user.type(within(sheet).getByLabelText("SKU"), "LUM-SF-30-WB");
    await user.click(within(sheet).getByLabelText("Size"));
    await user.click(await screen.findByRole("option", { name: SIZE.name }));
    await user.clear(within(sheet).getByLabelText("Opening stock"));
    await user.type(within(sheet).getByLabelText("Opening stock"), "12");
    await user.click(within(sheet).getByRole("button", { name: "Add variant" }));

    expect(await screen.findByText("LUM-SF-30-WB added")).toBeInTheDocument();
    expect(sentBody).toEqual({
      sku: "LUM-SF-30-WB",
      size_id: SIZE.id,
      shade_id: null,
      price_override: null,
      compare_at_price: null,
      stock_quantity: 12,
    });
    expect(await screen.findByRole("cell", { name: "LUM-SF-30-WB" })).toBeInTheDocument();
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("sends nothing until a SKU and a size are given", async () => {
    const user = userEvent.setup();
    let requests = 0;
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product([]))),
      http.post(`${PRODUCT_PATH}variants/`, () => {
        requests += 1;
        return HttpResponse.json(SAVED_VARIANT, { status: 201 });
      }),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    await user.click(await screen.findByRole("button", { name: "Add variant" }));
    const sheet = await screen.findByRole("dialog", { name: "New variant" });
    await user.click(within(sheet).getByRole("button", { name: "Add variant" }));

    expect(await within(sheet).findByText("Enter a SKU.")).toBeInTheDocument();
    expect(within(sheet).getByText("Choose a size.")).toBeInTheDocument();
    expect(requests).toBe(0);
  });

  it("closing the sheet discards a new variant without asking the API", async () => {
    const user = userEvent.setup();
    server.use(http.get(PRODUCT_PATH, () => HttpResponse.json(product([]))));
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    await user.click(await screen.findByRole("button", { name: "Add variant" }));
    const sheet = await screen.findByRole("dialog", { name: "New variant" });
    await user.type(within(sheet).getByLabelText("SKU"), "LUM-SF-30-WB");
    await user.click(within(sheet).getByRole("button", { name: "Close" }));

    await vi.waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("No variants yet")).toBeInTheDocument();
  });

  it("explains a duplicate SKU, or size and shade, in the sheet", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product())),
      http.patch(`*/api/v1/admin/variants/${VARIANT_ID}/`, () => errorEnvelope(409, "conflict")),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    await openAction(user, "LUM-SF-30-WB", "Edit");
    const sheet = await screen.findByRole("dialog", { name: "Edit LUM-SF-30-WB" });
    await user.type(within(sheet).getByLabelText("SKU"), "-2");
    await user.click(within(sheet).getByRole("button", { name: "Save variant" }));

    expect(
      await within(sheet).findByText(
        "Another variant already has this SKU, or this size and shade.",
      ),
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

    await openAction(user, "LUM-SF-30-WB", "Delete");
    const dialog = await screen.findByRole("alertdialog");
    expect(deleteRequests).toBe(0);
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(
      await screen.findByText(
        "LUM-SF-30-WB has been ordered, so it cannot be deleted. Set its stock to 0 instead.",
      ),
    ).toBeInTheDocument();
    expect(deleteRequests).toBe(1);
    expect(screen.getByRole("cell", { name: "LUM-SF-30-WB" })).toBeInTheDocument();
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

    await screen.findByRole("cell", { name: "LUM-SF-50-WB" });
    const saleRow = rowOf("LUM-SF-50-WB");
    const otherRow = rowOf("LUM-SF-30-WB");

    expect(within(saleRow).getByText("Rs 3,200.00")).toBeInTheDocument();
    expect(within(saleRow).getByText("−15%")).toBeInTheDocument();
    expect(within(otherRow).queryByText(/%$/)).not.toBeInTheDocument();
    expect(within(otherRow).getByText("—")).toBeInTheDocument();
  });

  it("puts the API's compare-at error on the field in the sheet", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(PRODUCT_PATH, () => HttpResponse.json(product())),
      http.patch(`*/api/v1/admin/variants/${VARIANT_ID}/`, () =>
        errorEnvelope(400, "validation_error", {
          compare_at_price: ["Must be greater than the price."],
        }),
      ),
    );
    renderApp(`/products/${PRODUCT_ID}?tab=variants`);

    await openAction(user, "LUM-SF-30-WB", "Edit");
    const sheet = await screen.findByRole("dialog", { name: "Edit LUM-SF-30-WB" });
    const field = within(sheet).getByLabelText("Compare-at price");
    await user.type(field, "2000");
    await user.click(within(sheet).getByRole("button", { name: "Save variant" }));

    expect(await within(sheet).findByText("Must be greater than the price.")).toBeInTheDocument();
    expect(field).toHaveAttribute("aria-invalid", "true");
  });
});
