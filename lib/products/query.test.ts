import { describe, expect, it } from "vitest";

import {
  parseProductFilters,
  parseProductTab,
  productsHref,
  toProductQuery,
} from "@/lib/products/query";

describe("product filters in the URL", () => {
  it("turns the URL into an API query with offset paging", () => {
    const filters = parseProductFilters({
      q: " silk ",
      brand: "b1",
      published: "no",
      stock: "low",
      on_sale: "true",
      page: "3",
    });

    expect(toProductQuery(filters)).toEqual({
      search: "silk",
      brand: "b1",
      category: undefined,
      is_published: false,
      low_stock: true,
      on_sale: true,
      ordering: "name",
      limit: 25,
      offset: 50,
    });
  });

  it("drops values it does not recognise instead of forwarding them", () => {
    const filters = parseProductFilters({
      published: "maybe",
      stock: "high",
      on_sale: "yes",
      page: "-2",
    });

    expect(filters).toMatchObject({
      published: undefined,
      lowStock: false,
      onSale: false,
      page: 1,
    });
    expect(toProductQuery(filters).on_sale).toBeUndefined();
  });

  it("writes the same filters back to a link", () => {
    const filters = parseProductFilters({
      q: "silk",
      category: "c1",
      stock: "low",
      on_sale: "true",
    });

    expect(productsHref({ ...filters, page: 2 })).toBe(
      "/products?q=silk&category=c1&stock=low&on_sale=true&page=2",
    );
  });
});

describe("parseProductTab", () => {
  it("opens a known tab and falls back to details", () => {
    expect(parseProductTab({ tab: "images" })).toBe("images");
    expect(parseProductTab({ tab: "pricing" })).toBe("details");
    expect(parseProductTab({})).toBe("details");
  });
});
