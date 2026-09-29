import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProductsView } from "@/components/products/ProductsView";
import type { Page, ProductListItem } from "@/lib/api/types";
import { parseProductFilters } from "@/lib/products/query";
import { productKeys } from "@/lib/products/queries";
import { taxonomyKeys } from "@/lib/taxonomy/queries";
import { product } from "@/tests/fixtures/products";
import { renderWithQuery, testQueryClient } from "@/tests/fixtures/query";
import { router } from "@/tests/fixtures/router";

vi.mock("next/navigation", async () => (await import("@/tests/fixtures/router")).navigationModule);
vi.mock("@/lib/products/actions", () => ({ setPublished: vi.fn(), removeProduct: vi.fn() }));

const replaceState = vi.spyOn(window.history, "replaceState");

function listItem(overrides: Partial<ProductListItem>): ProductListItem {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    category: product.category,
    base_price: product.base_price,
    is_published: true,
    sort_order: 0,
    created_at: product.created_at,
    updated_at: product.updated_at,
    variant_count: 1,
    total_stock: 12,
    primary_image_url: null,
    on_sale: false,
    ...overrides,
  };
}

function renderView(results: ProductListItem[]) {
  const client = testQueryClient();
  client.setQueryData(taxonomyKeys.kind("brands"), []);
  client.setQueryData(taxonomyKeys.kind("categories"), []);
  client.setQueryData<Page<ProductListItem>>(productKeys.list(parseProductFilters({})), {
    count: results.length,
    next: null,
    previous: null,
    results,
  });
  return renderWithQuery(<ProductsView />, client);
}

beforeEach(() => {
  router.searchParams = new URLSearchParams();
  replaceState.mockClear();
});

describe("ProductsView sale prices", () => {
  it("marks only the products the API reports as on sale", () => {
    renderView([
      listItem({ id: "p1", name: "Silk Foundation", on_sale: true }),
      listItem({ id: "p2", name: "Velvet Lip", on_sale: false }),
    ]);

    const onSale = screen.getByRole("row", { name: /Silk Foundation/ });
    const fullPrice = screen.getByRole("row", { name: /Velvet Lip/ });
    expect(within(onSale).getByText("On sale")).toBeInTheDocument();
    expect(within(fullPrice).queryByText("On sale")).not.toBeInTheDocument();
  });

  it("writes the on-sale filter to the URL", async () => {
    renderView([]);

    await userEvent.click(screen.getByRole("combobox", { name: "Sale" }));
    await userEvent.click(await screen.findByRole("option", { name: "On sale" }));

    expect(String(replaceState.mock.calls.at(-1)?.[2])).toBe("/products?on_sale=true");
  });
});
