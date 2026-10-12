import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";

import { saveSession } from "@/lib/repositories/session";
import { BRAND, CATEGORY, catalogueHandlers } from "@/test/catalogue";
import { server } from "@/test/msw-server";
import { renderApp } from "@/test/render-app";
import { chooseRowAction } from "@/test/row-menu";
import { meHandler } from "@/test/staff";

const PRODUCTS_PATH = "*/api/v1/admin/products/";

function product(name: string, overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    name,
    slug: name.toLowerCase().replace(/ /g, "-"),
    brand: { id: BRAND.id, name: BRAND.name, slug: BRAND.slug },
    category: { id: CATEGORY.id, name: CATEGORY.name, slug: CATEGORY.slug },
    base_price: "3200.00",
    is_published: true,
    sort_order: 0,
    variant_count: 2,
    total_stock: 14,
    on_sale: false,
    primary_image_url: null,
    created_at: "2026-09-01T09:00:00Z",
    updated_at: "2026-09-01T09:00:00Z",
    ...overrides,
  };
}

function productPage(results: unknown[]) {
  return { count: results.length, next: null, previous: null, results };
}

function errorEnvelope(status: number, code: string) {
  return HttpResponse.json({ error: { code, message: code, details: {} } }, { status });
}

beforeEach(() => {
  saveSession({ access: "a1", refresh: "r1" });
  server.use(meHandler, ...catalogueHandlers);
});

afterEach(() => localStorage.clear());

describe("products list", () => {
  it("shows each product with its price, stock and status", async () => {
    server.use(
      http.get(PRODUCTS_PATH, () =>
        HttpResponse.json(
          productPage([
            product("Silk Foundation", { on_sale: true }),
            product("Rose Toner", { total_stock: 0, is_published: false }),
          ]),
        ),
      ),
    );

    renderApp("/products");

    const silk = (await screen.findByRole("link", { name: "Silk Foundation" })).closest("tr");
    expect(within(silk as HTMLElement).getByText("Rs 3,200.00")).toBeInTheDocument();
    expect(within(silk as HTMLElement).getByText("On sale")).toBeInTheDocument();
    const toner = screen.getByRole("link", { name: "Rose Toner" }).closest("tr") as HTMLElement;
    expect(within(toner).getByText("Out")).toBeInTheDocument();
    expect(within(toner).getByText("Draft")).toBeInTheDocument();
    expect(within(toner).queryByText("On sale")).not.toBeInTheDocument();
  });

  it("sends the URL's filters to the API in its own terms", async () => {
    let sent = new URLSearchParams();
    server.use(
      http.get(PRODUCTS_PATH, ({ request }) => {
        sent = new URL(request.url).searchParams;
        return HttpResponse.json(productPage([]));
      }),
    );

    renderApp(
      `/products?q=silk&brand=${BRAND.id}&category=${CATEGORY.id}&published=no&stock=low&on_sale=true&page=2`,
    );

    await screen.findByText("No products match these filters");
    expect(Object.fromEntries(sent)).toEqual({
      search: "silk",
      brand: BRAND.id,
      category: CATEGORY.id,
      is_published: "false",
      low_stock: "true",
      on_sale: "true",
      ordering: "name",
      limit: "25",
      offset: "25",
    });
  });

  it("filters by the brand chosen in its combobox and clears it with All brands", async () => {
    const user = userEvent.setup();
    let sent = new URLSearchParams();
    server.use(
      http.get(PRODUCTS_PATH, ({ request }) => {
        sent = new URL(request.url).searchParams;
        return HttpResponse.json(productPage([product("Silk Foundation")]));
      }),
    );
    const { router } = renderApp("/products");
    const brand = await screen.findByRole("combobox", { name: "Brand" });
    expect(brand).toHaveTextContent("All brands");

    await user.click(brand);
    await user.click(await screen.findByRole("option", { name: BRAND.name }));

    await vi.waitFor(() => expect(sent.get("brand")).toBe(BRAND.id));
    expect(router.state.location.search).toMatchObject({ brand: BRAND.id });
    expect(brand).toHaveTextContent(BRAND.name);

    await user.click(brand);
    await user.click(await screen.findByRole("option", { name: "All brands" }));

    await vi.waitFor(() => expect(router.state.location.search).not.toHaveProperty("brand"));
    expect(brand).toHaveTextContent("All brands");
  });

  it("sorts by price from its header, cheapest first and then dearest", async () => {
    const user = userEvent.setup();
    const orderings: (string | null)[] = [];
    server.use(
      http.get(PRODUCTS_PATH, ({ request }) => {
        orderings.push(new URL(request.url).searchParams.get("ordering"));
        return HttpResponse.json(productPage([product("Silk Foundation")]));
      }),
    );
    const { router } = renderApp("/products?page=2");
    const productHeader = await screen.findByRole("columnheader", { name: /Product/ });
    expect(productHeader).toHaveAttribute("aria-sort", "ascending");

    await user.click(screen.getByRole("button", { name: /Price/ }));

    await vi.waitFor(() => expect(orderings.at(-1)).toBe("base_price"));
    expect(router.state.location.search).toEqual({ sort: "base_price" });
    expect(screen.getByRole("columnheader", { name: /Price/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(productHeader).not.toHaveAttribute("aria-sort");

    await user.click(screen.getByRole("button", { name: /Price/ }));

    await vi.waitFor(() => expect(orderings.at(-1)).toBe("-base_price"));
    expect(router.state.location.search).toEqual({ sort: "-base_price" });
  });

  it("offers no sort on columns the API cannot order", async () => {
    server.use(
      http.get(PRODUCTS_PATH, () => HttpResponse.json(productPage([product("Silk Foundation")]))),
    );
    renderApp("/products");
    await screen.findByText("Silk Foundation");

    for (const name of ["Brand", "Category", "Variants", "Stock", "Status"]) {
      expect(
        within(screen.getByRole("columnheader", { name })).queryByRole("button"),
      ).not.toBeInTheDocument();
    }
  });

  it("says when there are no products at all", async () => {
    server.use(http.get(PRODUCTS_PATH, () => HttpResponse.json(productPage([]))));

    renderApp("/products");

    expect(await screen.findByText("No products yet")).toBeInTheDocument();
  });

  it("shows a publish at once and puts it back when the API refuses", async () => {
    const user = userEvent.setup();
    const draft = product("Rose Toner", { is_published: false, variant_count: 0 });
    server.use(
      http.get(PRODUCTS_PATH, () => HttpResponse.json(productPage([draft]))),
      http.patch(`${PRODUCTS_PATH}${draft.id}/`, async () => {
        await delay(100);
        return errorEnvelope(422, "product_has_no_variants");
      }),
    );
    renderApp("/products");
    const row = (await screen.findByRole("link", { name: "Rose Toner" })).closest(
      "tr",
    ) as HTMLElement;

    await user.pointer({ keys: "[MouseRight]", target: row });
    await user.click(await screen.findByRole("menuitem", { name: "Publish" }));

    expect(await within(row).findByText("Published")).toBeInTheDocument();
    expect(
      await screen.findByText("Add at least one variant before publishing."),
    ).toBeInTheDocument();
    expect(await within(row).findByText("Draft")).toBeInTheDocument();
  });

  it("offers to unpublish an ordered product that cannot be deleted", async () => {
    const user = userEvent.setup();
    const silk = product("Silk Foundation");
    let sentPatch: unknown;
    server.use(
      http.get(PRODUCTS_PATH, () => HttpResponse.json(productPage([silk]))),
      http.delete(`${PRODUCTS_PATH}${silk.id}/`, () => errorEnvelope(409, "conflict")),
      http.patch(`${PRODUCTS_PATH}${silk.id}/`, async ({ request }) => {
        sentPatch = await request.json();
        return HttpResponse.json({
          ...silk,
          is_published: false,
          description: "",
          skin_types: [],
          skin_feel: "",
          key_ingredients: "",
          variants: [],
          images: [],
        });
      }),
    );
    renderApp("/products");

    await chooseRowAction(user, "Silk Foundation", "Delete");
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }),
    );
    await user.click(await screen.findByRole("button", { name: "Unpublish instead" }));

    expect(await screen.findByText("Silk Foundation unpublished")).toBeInTheDocument();
    expect(sentPatch).toEqual({ is_published: false });
  });

  it("opens the row's actions on right-click, with the same delete confirm", async () => {
    const user = userEvent.setup();
    let isDeleted = false;
    const toner = product("Rose Toner");
    server.use(
      http.get(PRODUCTS_PATH, () => HttpResponse.json(productPage(isDeleted ? [] : [toner]))),
      http.delete(`${PRODUCTS_PATH}${toner.id}/`, () => {
        isDeleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderApp("/products");
    const row = (await screen.findByRole("link", { name: "Rose Toner" })).closest(
      "tr",
    ) as HTMLElement;

    await user.pointer({ keys: "[MouseRight]", target: within(row).getByText(BRAND.name) });
    const menu = await screen.findByRole("menu");
    expect(
      within(menu)
        .getAllByRole("menuitem")
        .map((item) => item.textContent),
    ).toEqual(["Edit", "Unpublish", "Delete"]);
    await user.click(within(menu).getByRole("menuitem", { name: "Delete" }));
    await user.click(
      within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }),
    );

    expect(await screen.findByText("Rose Toner deleted")).toBeInTheDocument();
  });
});
