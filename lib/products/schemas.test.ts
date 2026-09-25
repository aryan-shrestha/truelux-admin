import { describe, expect, it } from "vitest";

import { imageUploadSchema, productSchema, variantSchema } from "@/lib/products/schemas";

const product = {
  name: "Silk Foundation",
  slug: "",
  description: "",
  brand_id: "b1",
  category_id: "c1",
  base_price: "3200.00",
  is_published: false,
  sort_order: 0,
};

const variant = {
  sku: "LUM-SF-30-WB",
  size_id: "s1",
  shade_id: null,
  stock_quantity: 12,
  price_override: "",
};

describe("productSchema", () => {
  it.each(["3200", "3200.5", "3200.00", "0"])("accepts the price %s as a string", (base_price) => {
    const parsed = productSchema.parse({ ...product, base_price });
    expect(parsed.base_price).toBe(base_price);
  });

  it.each(["", "-5", "3,200", "3200.001", "1e3", "abc"])("rejects the price %s", (base_price) => {
    expect(productSchema.safeParse({ ...product, base_price }).success).toBe(false);
  });

  it("requires a brand and a category", () => {
    const result = productSchema.safeParse({ ...product, brand_id: "", category_id: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(["brand_id", "category_id"]);
  });
});

describe("variantSchema", () => {
  it("turns a blank price override into null so the base price applies", () => {
    expect(variantSchema.parse(variant).price_override).toBeNull();
  });

  it("keeps a price override as a decimal string", () => {
    expect(variantSchema.parse({ ...variant, price_override: "2999.50" }).price_override).toBe("2999.50");
  });

  it.each(["0", "0.00", "-1", "12.345"])("rejects the price override %s", (price_override) => {
    expect(variantSchema.safeParse({ ...variant, price_override }).success).toBe(false);
  });

  it.each([-1, 1.5, Number.NaN])("rejects the stock %s", (stock_quantity) => {
    expect(variantSchema.safeParse({ ...variant, stock_quantity }).success).toBe(false);
  });

  it("accepts zero stock and no shade", () => {
    expect(variantSchema.safeParse({ ...variant, stock_quantity: 0 }).success).toBe(true);
  });

  it("parses its own output again, as the server action does", () => {
    const once = variantSchema.parse({ ...variant, price_override: "" });
    expect(variantSchema.parse(once)).toEqual(once);
  });
});

describe("imageUploadSchema", () => {
  function file(type: string, bytes: number) {
    return new File([new Uint8Array(bytes)], "photo", { type });
  }

  it("accepts a JPEG, PNG or WebP up to 5 MB", () => {
    for (const type of ["image/jpeg", "image/png", "image/webp"]) {
      expect(imageUploadSchema.safeParse({ file: file(type, 5 * 1024 * 1024), alt_text: "", is_primary: false }).success).toBe(true);
    }
  });

  it("rejects a GIF and anything over 5 MB", () => {
    expect(imageUploadSchema.safeParse({ file: file("image/gif", 10), alt_text: "", is_primary: false }).success).toBe(false);
    expect(
      imageUploadSchema.safeParse({ file: file("image/png", 5 * 1024 * 1024 + 1), alt_text: "", is_primary: false }).success,
    ).toBe(false);
  });
});
