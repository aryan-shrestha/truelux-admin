import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { describe, expect, it, vi } from "vitest";

import { ProductRowActions } from "@/components/products/ProductRowActions";
import type { ActionResult } from "@/lib/actions/attempt";
import type { Page, Product, ProductListItem } from "@/lib/api/types";
import { setPublished } from "@/lib/products/actions";
import { productKeys } from "@/lib/products/queries";
import { product } from "@/tests/fixtures/products";
import { renderWithQuery, testQueryClient } from "@/tests/fixtures/query";

vi.mock("@/lib/products/actions", () => ({ setPublished: vi.fn(), removeProduct: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const row: ProductListItem = {
  id: product.id,
  name: product.name,
  slug: product.slug,
  brand: product.brand,
  category: product.category,
  base_price: product.base_price,
  is_published: false,
  sort_order: 0,
  created_at: product.created_at,
  updated_at: product.updated_at,
  variant_count: 0,
  total_stock: 0,
  primary_image_url: null,
};

const listKey = productKeys.list({
  q: "",
  brand: undefined,
  category: undefined,
  published: undefined,
  lowStock: false,
  page: 1,
});

describe("ProductRowActions publish", () => {
  it("flips the row at once and back when the API refuses", async () => {
    let answer: (result: ActionResult<Product>) => void = () => {};
    vi.mocked(setPublished).mockReturnValueOnce(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    const client = testQueryClient();
    client.setQueryData<Page<ProductListItem>>(listKey, {
      count: 1,
      next: null,
      previous: null,
      results: [row],
    });
    const published = () =>
      client.getQueryData<Page<ProductListItem>>(listKey)?.results[0]?.is_published;
    renderWithQuery(<ProductRowActions product={row} />, client);

    await userEvent.click(screen.getByRole("button", { name: `Actions for ${product.name}` }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Publish" }));

    await waitFor(() => expect(published()).toBe(true));

    answer({
      ok: false,
      code: "product_has_no_variants",
      message: "Add at least one variant before publishing.",
      fieldErrors: {},
      details: {},
    });

    await waitFor(() => expect(published()).toBe(false));
    expect(toast.error).toHaveBeenCalledWith("Add at least one variant before publishing.");
  });
});
