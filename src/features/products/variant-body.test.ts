import { VARIANT_FORM_SCHEMA } from "./schemas/variant-form.schema";
import { toVariantBody } from "./variant-body";

const VALUES = {
  sku: "LUM-SF-30-WB",
  size_id: "0c000000-0000-4000-8000-000000000005",
  shade_id: null,
  stock_quantity: 12,
  price_override: "",
  compare_at_price: "",
};

describe("variant request bodies", () => {
  it("sends blank prices as null and stock only for a new variant", () => {
    expect(toVariantBody(VALUES, true)).toEqual({
      sku: "LUM-SF-30-WB",
      size_id: VALUES.size_id,
      shade_id: null,
      price_override: null,
      compare_at_price: null,
      stock_quantity: 12,
    });
    expect(toVariantBody(VALUES, false)).not.toHaveProperty("stock_quantity");
  });

  it("accepts an empty or decimal price and a whole stock of 0 or more", () => {
    expect(VARIANT_FORM_SCHEMA.safeParse({ ...VALUES, price_override: "2720.5" }).success).toBe(
      true,
    );
    expect(VARIANT_FORM_SCHEMA.safeParse({ ...VALUES, price_override: "27,20" }).success).toBe(
      false,
    );
    expect(VARIANT_FORM_SCHEMA.safeParse({ ...VALUES, stock_quantity: "-1" }).success).toBe(false);
    expect(VARIANT_FORM_SCHEMA.safeParse({ ...VALUES, stock_quantity: "2.5" }).success).toBe(false);
  });
});

describe("compare-at price", () => {
  it("keeps a compare-at price as the string typed, whatever the price", () => {
    const values = VARIANT_FORM_SCHEMA.parse({
      ...VALUES,
      price_override: "3200",
      compare_at_price: "100.5",
    });

    expect(toVariantBody(values, false)).toMatchObject({
      price_override: "3200",
      compare_at_price: "100.5",
    });
  });

  it.each(["0", "0.00", "-1", "3,200", "12.345", "abc"])("rejects %s", (compare_at_price) => {
    expect(VARIANT_FORM_SCHEMA.safeParse({ ...VALUES, compare_at_price }).success).toBe(false);
  });
});
