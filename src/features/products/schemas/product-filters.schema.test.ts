import { PRODUCT_FILTERS_SCHEMA } from "./product-filters.schema";

describe("PRODUCT_FILTERS_SCHEMA", () => {
  it.each(["yes", "1", "false", false])(
    "drops on_sale=%s, which the API would refuse",
    (on_sale) => {
      expect(PRODUCT_FILTERS_SCHEMA.parse({ on_sale }).on_sale).toBeUndefined();
    },
  );

  it("keeps known values and drops the rest instead of failing", () => {
    const filters = PRODUCT_FILTERS_SCHEMA.parse({
      q: " silk ",
      brand: "0c000000-0000-4000-8000-000000000001",
      category: "not-a-uuid",
      published: "maybe",
      stock: "low",
      on_sale: true,
      sort: "-created_at",
      page: "0",
    });

    expect(filters).toEqual({
      q: "silk",
      brand: "0c000000-0000-4000-8000-000000000001",
      stock: "low",
      on_sale: true,
    });
  });

  it("keeps a sort the table offers", () => {
    expect(PRODUCT_FILTERS_SCHEMA.parse({ sort: "-base_price" }).sort).toBe("-base_price");
  });
});
