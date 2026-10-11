import { toBrandBody, toShadeBody, toTaxonomyBody } from "./taxonomy-body";

describe("taxonomy request bodies", () => {
  it("leaves out a blank slug so the API derives one", () => {
    expect(toTaxonomyBody({ name: "30 ml", slug: "", sort_order: 0 })).toEqual({
      name: "30 ml",
      sort_order: 0,
    });
    expect(toTaxonomyBody({ name: "30 ml", slug: "30-ml", sort_order: 0 })).toEqual({
      name: "30 ml",
      slug: "30-ml",
      sort_order: 0,
    });
  });

  it("sends the hex in capitals", () => {
    const body = toShadeBody({ name: "Warm", slug: "", hex_code: "#d8a47f", sort_order: 0 });

    expect(body).toMatchObject({ hex_code: "#D8A47F" });
  });

  it("sends a brand with a new logo as multipart, otherwise as JSON", () => {
    const fields = { name: "Lumière", slug: "", description: "", is_active: true, sort_order: 2 };
    const logo = new File(["x"], "logo.png", { type: "image/png" });

    const withLogo = toBrandBody({ ...fields, logo });
    const withoutLogo = toBrandBody({ ...fields, logo: null });

    expect(withLogo).toBeInstanceOf(FormData);
    expect(Object.fromEntries((withLogo as FormData).entries())).toEqual({
      name: "Lumière",
      description: "",
      is_active: "true",
      sort_order: "2",
      logo,
    });
    expect(withoutLogo).toEqual({
      name: "Lumière",
      description: "",
      is_active: true,
      sort_order: 2,
    });
  });
});
