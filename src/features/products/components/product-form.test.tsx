import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { BRAND, CATEGORY, catalogueHandlers, SKIN_TYPES } from "@/test/catalogue";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { meHandler } from "@/test/staff";

const PRODUCT_ID = "0d000000-0000-4000-8000-000000000001";
const [OILY, DRY] = SKIN_TYPES as [(typeof SKIN_TYPES)[number], (typeof SKIN_TYPES)[number]];

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: PRODUCT_ID,
    name: "Silk Foundation",
    slug: "silk-foundation",
    description: "A light foundation.",
    brand: { id: BRAND.id, name: BRAND.name, slug: BRAND.slug },
    category: { id: CATEGORY.id, name: CATEGORY.name, slug: CATEGORY.slug },
    base_price: "3200.00",
    is_published: false,
    sort_order: 0,
    skin_types: [{ id: OILY.id, name: OILY.name, slug: OILY.slug }],
    skin_feel: "Velvety",
    key_ingredients: "Niacinamide",
    variants: [],
    images: [],
    created_at: "2026-09-01T09:00:00Z",
    updated_at: "2026-09-01T09:00:00Z",
    ...overrides,
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

async function choose(user: ReturnType<typeof userEvent.setup>, label: string, option: string) {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole("option", { name: option }));
}

describe("new product", () => {
  it("asks for a brand, a category and a valid price before sending anything", async () => {
    const user = userEvent.setup();
    renderApp("/products/new");

    await user.type(await screen.findByLabelText("Name"), "Silk Foundation");
    await user.type(screen.getByLabelText("Base price"), "32,00");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(await screen.findByText("Choose a brand.")).toBeInTheDocument();
    expect(screen.getByText("Choose a category.")).toBeInTheDocument();
    expect(screen.getByText("Enter an amount such as 1250 or 1250.50.")).toBeInTheDocument();
  });

  it("searches brands as staff type and shows the chosen one", async () => {
    const user = userEvent.setup();
    const maison = {
      ...BRAND,
      id: "0c000000-0000-4000-8000-000000000009",
      name: "Maison",
      slug: "maison",
    };
    server.use(http.get("*/api/v1/admin/brands/", () => HttpResponse.json([BRAND, maison])));
    renderApp("/products/new");
    const brand = await screen.findByRole("combobox", { name: "Brand" });

    await user.click(brand);
    await user.type(await screen.findByPlaceholderText("Search brand"), "mai");
    expect(await screen.findByRole("option", { name: "Maison" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: BRAND.name })).not.toBeInTheDocument();
    await user.click(screen.getByRole("option", { name: "Maison" }));
    expect(brand).toHaveTextContent("Maison");

    await user.click(brand);
    await user.type(await screen.findByPlaceholderText("Search brand"), "zzz");
    expect(await screen.findByText("No brand matches.")).toBeInTheDocument();
  });

  it("creates the product and opens it", async () => {
    const user = userEvent.setup();
    let sentBody: unknown;
    server.use(
      http.post("*/api/v1/admin/products/", async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(product({ skin_types: [] }), { status: 201 });
      }),
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () =>
        HttpResponse.json(product({ skin_types: [] })),
      ),
    );
    const { router } = renderApp("/products/new");

    await user.type(await screen.findByLabelText("Name"), "Silk Foundation");
    await choose(user, "Brand", BRAND.name);
    await choose(user, "Category", CATEGORY.name);
    await user.type(screen.getByLabelText("Base price"), "3200");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    expect(await screen.findByText("Product created")).toBeInTheDocument();
    await vi.waitFor(() => expect(router.state.location.pathname).toBe(`/products/${PRODUCT_ID}`));
    expect(sentBody).toEqual({
      name: "Silk Foundation",
      description: "",
      brand_id: BRAND.id,
      category_id: CATEGORY.id,
      base_price: "3200",
      sort_order: 0,
      skin_type_ids: [],
      skin_feel: "",
      key_ingredients: "",
    });
  });
});

describe("product details", () => {
  it("starts from the saved product and sends the whole skin-type set", async () => {
    const user = userEvent.setup();
    let sentBody: Record<string, unknown> = {};
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => HttpResponse.json(product())),
      http.patch(`*/api/v1/admin/products/${PRODUCT_ID}/`, async ({ request }) => {
        sentBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(product({ skin_types: [OILY, DRY] }));
      }),
    );
    renderApp(`/products/${PRODUCT_ID}`);

    expect(await screen.findByLabelText("Name")).toHaveValue("Silk Foundation");
    expect(screen.getByLabelText("Base price")).toHaveValue("3200.00");
    await user.click(screen.getByRole("combobox", { name: "Skin types" }));
    await user.click(await screen.findByRole("option", { name: "Dry" }));
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Save product" }));

    expect(await screen.findByText("Product saved")).toBeInTheDocument();
    expect(sentBody.skin_type_ids).toEqual([OILY.id, DRY.id]);
    expect(sentBody.slug).toBe("silk-foundation");
  });

  it("publishes from the header and then offers Unpublish", async () => {
    const user = userEvent.setup();
    let sentBody: unknown;
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => HttpResponse.json(product())),
      http.patch(`*/api/v1/admin/products/${PRODUCT_ID}/`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(product({ is_published: true }));
      }),
    );
    renderApp(`/products/${PRODUCT_ID}`);

    await user.click(await screen.findByRole("button", { name: "Publish" }));

    expect(await screen.findByText("Silk Foundation published")).toBeInTheDocument();
    expect(sentBody).toEqual({ is_published: true });
    expect(await screen.findByRole("button", { name: "Unpublish" })).toBeInTheDocument();
    expect(screen.queryByRole("switch", { name: "Published" })).not.toBeInTheDocument();
  });

  it("says why a product without variants cannot be published", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => HttpResponse.json(product())),
      http.patch(`*/api/v1/admin/products/${PRODUCT_ID}/`, () =>
        errorEnvelope(422, "product_has_no_variants"),
      ),
    );
    renderApp(`/products/${PRODUCT_ID}`);

    await user.click(await screen.findByRole("button", { name: "Publish" }));

    expect(
      await screen.findByText("Add at least one variant before publishing."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeEnabled();
  });

  it("counts the variants in the Variants tab", async () => {
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => HttpResponse.json(product())),
    );
    renderApp(`/products/${PRODUCT_ID}`);

    expect(await screen.findByRole("tab", { name: "Variants (0)" })).toBeInTheDocument();
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
  });

  it("puts the API's field message under the field", async () => {
    const user = userEvent.setup();
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => HttpResponse.json(product())),
      http.patch(`*/api/v1/admin/products/${PRODUCT_ID}/`, () =>
        errorEnvelope(400, "validation_error", {
          base_price: ["Ensure this value is greater than or equal to 0."],
        }),
      ),
    );
    renderApp(`/products/${PRODUCT_ID}`);

    await user.click(await screen.findByRole("button", { name: "Save product" }));

    const field = screen.getByLabelText("Base price");
    expect(
      await screen.findByText("Ensure this value is greater than or equal to 0."),
    ).toBeInTheDocument();
    expect(field).toHaveAttribute("aria-invalid", "true");
  });

  it("shows the not-found page for a product that does not exist", async () => {
    server.use(
      http.get(`*/api/v1/admin/products/${PRODUCT_ID}/`, () => errorEnvelope(404, "not_found")),
    );

    renderApp(`/products/${PRODUCT_ID}`);

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
  });
});
