import { z } from "zod";

import { isPositiveAmount, MONEY_PATTERN } from "@/lib/format/money";

const AMOUNT_MESSAGE = "Enter an amount like 150 or 150.50.";

const feeField = z.string().trim().regex(MONEY_PATTERN, AMOUNT_MESSAGE);

// The threshold keeps its text while the switch is off, so turning free shipping back
// on restores what the merchant typed; it is only checked, and sent, while on.
export const shippingSettingsSchema = z
  .object({
    inside_valley_fee: feeField,
    outside_valley_fee: feeField,
    has_free_shipping: z.boolean(),
    free_shipping_threshold: z.string().trim(),
  })
  .superRefine(({ has_free_shipping, free_shipping_threshold: threshold }, context) => {
    if (!has_free_shipping) return;
    const message =
      threshold === ""
        ? "Enter the order amount that ships free."
        : !MONEY_PATTERN.test(threshold)
          ? AMOUNT_MESSAGE
          : !isPositiveAmount(threshold)
            ? "Must be more than 0."
            : null;
    if (message) {
      context.addIssue({ code: "custom", path: ["free_shipping_threshold"], message });
    }
  });

export type ShippingSettingsValues = z.infer<typeof shippingSettingsSchema>;
