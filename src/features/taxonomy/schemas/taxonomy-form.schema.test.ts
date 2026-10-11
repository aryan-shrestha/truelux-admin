import { BRAND_FORM_SCHEMA, SHADE_FORM_SCHEMA, SIZE_FORM_SCHEMA } from "./taxonomy-form.schema";

const SIZE = { name: "30 ml", slug: "", sort_order: "0" };

describe("taxonomy form schemas", () => {
  it.each(["#D8A47F", "#d8a47f"])("accepts the hex %s", (hex_code) => {
    expect(SHADE_FORM_SCHEMA.safeParse({ ...SIZE, hex_code }).success).toBe(true);
  });

  it.each(["red", "#FFF", "#GGGGGG", "D8A47F"])("rejects the hex %s", (hex_code) => {
    expect(SHADE_FORM_SCHEMA.safeParse({ ...SIZE, hex_code }).success).toBe(false);
  });

  it("allows an empty slug and rejects one with spaces or capitals", () => {
    expect(SIZE_FORM_SCHEMA.safeParse(SIZE).success).toBe(true);
    expect(SIZE_FORM_SCHEMA.safeParse({ ...SIZE, slug: "Thirty ml" }).success).toBe(false);
  });

  it("takes the sort order as a whole number of 0 or more", () => {
    expect(SIZE_FORM_SCHEMA.parse({ ...SIZE, sort_order: "3" }).sort_order).toBe(3);
    expect(SIZE_FORM_SCHEMA.safeParse({ ...SIZE, sort_order: "-1" }).success).toBe(false);
    expect(SIZE_FORM_SCHEMA.safeParse({ ...SIZE, sort_order: "1.5" }).success).toBe(false);
  });

  it("accepts a JPEG, PNG or WebP logo up to 5 MB", () => {
    const brand = { ...SIZE, name: "Lumière", description: "", is_active: true };
    const png = new File(["x"], "logo.png", { type: "image/png" });
    const gif = new File(["x"], "logo.gif", { type: "image/gif" });
    const huge = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });

    expect(BRAND_FORM_SCHEMA.safeParse({ ...brand, logo: png }).success).toBe(true);
    expect(BRAND_FORM_SCHEMA.safeParse({ ...brand, logo: null }).success).toBe(true);
    expect(BRAND_FORM_SCHEMA.safeParse({ ...brand, logo: gif }).success).toBe(false);
    expect(BRAND_FORM_SCHEMA.safeParse({ ...brand, logo: huge }).success).toBe(false);
  });
});
