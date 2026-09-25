import { describe, expect, it } from "vitest";

import { withoutBlankSlug } from "@/lib/catalog/fields";
import { categorySchema, shadeSchema, sizeSchema } from "@/lib/taxonomy/schemas";

const shade = { name: "Warm Beige", slug: "", hex_code: "#D8A47F", sort_order: 0 };

describe("shadeSchema", () => {
  it.each(["#D8A47F", "#d8a47f", "#000000"])("accepts %s", (hex_code) => {
    expect(shadeSchema.safeParse({ ...shade, hex_code }).success).toBe(true);
  });

  it.each(["red", "#FFF", "#GGGGGG", "D8A47F", "#D8A47F0"])("rejects %s", (hex_code) => {
    expect(shadeSchema.safeParse({ ...shade, hex_code }).success).toBe(false);
  });
});

describe("shared taxonomy fields", () => {
  it("allows a blank slug so the API derives one", () => {
    expect(sizeSchema.safeParse({ name: "30 ml", slug: "", sort_order: 0 }).success).toBe(true);
  });

  it.each(["Warm Beige", "warm--beige", "-warm", "warm_beige"])("rejects the slug %s", (slug) => {
    expect(sizeSchema.safeParse({ name: "30 ml", slug, sort_order: 0 }).success).toBe(false);
  });

  it.each([-1, 1.5, Number.NaN])("rejects the sort order %s", (sort_order) => {
    expect(sizeSchema.safeParse({ name: "30 ml", slug: "", sort_order }).success).toBe(false);
  });

  it("requires a name", () => {
    expect(
      categorySchema.safeParse({ name: "  ", slug: "", parent_id: null, sort_order: 0 }).success,
    ).toBe(false);
  });

  it("drops a blank slug from the request body and keeps a real one", () => {
    expect(withoutBlankSlug({ name: "Face", slug: "" })).toEqual({ name: "Face" });
    expect(withoutBlankSlug({ name: "Face", slug: "face" })).toEqual({
      name: "Face",
      slug: "face",
    });
  });
});
