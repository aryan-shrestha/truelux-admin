import { SHIPPING_FORM_SCHEMA } from "./schemas/shipping-form.schema";
import { toShippingBody } from "./shipping-body";

const VALUES = {
  inside_valley_fee: "150",
  outside_valley_fee: "250.00",
  has_free_shipping: true,
  free_shipping_threshold: "5000",
};

describe("shipping settings form", () => {
  it("accepts a fee of 0 and rejects negatives, commas and three decimals", () => {
    expect(SHIPPING_FORM_SCHEMA.safeParse({ ...VALUES, inside_valley_fee: "0" }).success).toBe(
      true,
    );
    for (const fee of ["-1", "1,500", "150.505"]) {
      expect(SHIPPING_FORM_SCHEMA.safeParse({ ...VALUES, inside_valley_fee: fee }).success).toBe(
        false,
      );
    }
  });

  it.each(["", "0", "0.00", "-5"])(
    "rejects the threshold %s while free shipping is on",
    (free_shipping_threshold) => {
      expect(SHIPPING_FORM_SCHEMA.safeParse({ ...VALUES, free_shipping_threshold }).success).toBe(
        false,
      );
    },
  );

  it("ignores the threshold while free shipping is off", () => {
    const result = SHIPPING_FORM_SCHEMA.safeParse({
      ...VALUES,
      has_free_shipping: false,
      free_shipping_threshold: "nonsense",
    });

    expect(result.success).toBe(true);
  });

  it("sends a null threshold when off and the trimmed amount when on", () => {
    const off = SHIPPING_FORM_SCHEMA.parse({ ...VALUES, has_free_shipping: false });
    const on = SHIPPING_FORM_SCHEMA.parse({ ...VALUES, free_shipping_threshold: " 5000 " });

    expect(toShippingBody(off)).toEqual({
      inside_valley_fee: "150",
      outside_valley_fee: "250.00",
      free_shipping_threshold: null,
    });
    expect(toShippingBody(on).free_shipping_threshold).toBe("5000");
  });
});
