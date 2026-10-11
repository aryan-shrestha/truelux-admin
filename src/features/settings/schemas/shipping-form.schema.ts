import { z } from "zod";

import { MONEY_PATTERN } from "@/lib/money";

const FEE = z.string().trim().regex(MONEY_PATTERN, "Enter an amount such as 150 or 150.50.");

// `has_free_shipping` exists only in the form: switching free shipping off and on again
// keeps the threshold typed. The threshold is checked only while the switch is on, and
// must then be above 0, judged on its digits rather than as a float.
export const SHIPPING_FORM_SCHEMA = z
  .object({
    inside_valley_fee: FEE,
    outside_valley_fee: FEE,
    has_free_shipping: z.boolean(),
    free_shipping_threshold: z.string().trim(),
  })
  .superRefine((values, context) => {
    if (!values.has_free_shipping) return;
    const threshold = values.free_shipping_threshold;
    if (!MONEY_PATTERN.test(threshold) || !/[1-9]/.test(threshold)) {
      context.addIssue({
        code: "custom",
        path: ["free_shipping_threshold"],
        message: "Enter an amount above 0, such as 5000.",
      });
    }
  });

export type ShippingFormValues = z.infer<typeof SHIPPING_FORM_SCHEMA>;
