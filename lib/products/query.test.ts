import { describe, expect, it } from "vitest";

import { parseProductFilters, parseProductTab, productsHref, toProductQuery } from "@/lib/products/query";

describe("product filters in the URL", () => {
  it("turns the URL into an API query with offset paging", () => {
    const filters = parseProductFilters({ q: " silk ", brand: "b1", published: "no", stock: "low", page: "3" });

    expect(toProductQuery(filters)).toEqual({
      search: "silk",
      brand: "b1",
      category: undefined,
      is_published: false,
      low_stock: true,
      ordering: "name",
      limit: 25,
      offset: 50,
    });
  });

  it("drops values it does not recognise instead of forwarding them", () => {
    const filters = parseProductFilters({ published: "maybe", stock: "high", page: "-2" });

    expect(filters).toMatchObject({ published: undefined, lowStock: false, page: 1 });
  });

  it("writes the same filters back to a link", () => {
    const filters = parseProductFilters({ q: "silk", category: "c1", stock: "low" });

    expect(productsHref({ ...filters, page: 2 })).toBe("/products?q=silk&category=c1&stock=low&page=2");
  });
});

describe("parseProductTab", () => {
  it("opens a known tab and falls back to details", () => {
    expect(parseProductTab({ tab: "images" })).toBe("images");
    expect(parseProductTab({ tab: "pricing" })).toBe("details");
    expect(parseProductTab({})).toBe("details");
  });
});
