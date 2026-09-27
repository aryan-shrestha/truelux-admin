import { describe, expect, it } from "vitest";

import { shippingSettingsSchema } from "@/lib/settings/schemas";

const values = {
  inside_valley_fee: "150.00",
  outside_valley_fee: "250",
  has_free_shipping: true,
  free_shipping_threshold: "8000",
};

function failedPaths(input: object) {
  const result = shippingSettingsSchema.safeParse(input);
  return result.error?.issues.map((issue) => issue.path[0]) ?? [];
}

describe("shippingSettingsSchema", () => {
  it("accepts fees of 0 and keeps amounts as strings", () => {
    const parsed = shippingSettingsSchema.parse({ ...values, inside_valley_fee: "0" });
    expect(parsed.inside_valley_fee).toBe("0");
    expect(parsed.free_shipping_threshold).toBe("8000");
  });

  it.each(["-1", "", "1,500", "150.001", "abc"])("rejects the fee %s", (fee) => {
    expect(failedPaths({ ...values, inside_valley_fee: fee, outside_valley_fee: fee })).toEqual([
      "inside_valley_fee",
      "outside_valley_fee",
    ]);
  });

  it.each(["", "0", "0.00", "-5", "8,000"])(
    "requires a threshold above 0 while free shipping is on, not %s",
    (threshold) => {
      expect(failedPaths({ ...values, free_shipping_threshold: threshold })).toEqual([
        "free_shipping_threshold",
      ]);
    },
  );

  it("ignores the threshold while free shipping is off", () => {
    expect(
      shippingSettingsSchema.safeParse({
        ...values,
        has_free_shipping: false,
        free_shipping_threshold: "",
      }).success,
    ).toBe(true);
  });

  it("reports a bad fee and a missing threshold together", () => {
    expect(
      failedPaths({ ...values, outside_valley_fee: "x", free_shipping_threshold: "" }),
    ).toEqual(["outside_valley_fee", "free_shipping_threshold"]);
  });
});
