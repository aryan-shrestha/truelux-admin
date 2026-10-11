import { z } from "zod";

import { MONEY_PATTERN } from "@/lib/money";

// Empty means "use the product's price" / "not on sale"; the API's own rule that a
// compare-at price exceeds the variant's price is left to the API.
const OPTIONAL_AMOUNT = z
  .string()
  .trim()
  .refine((value) => value === "" || MONEY_PATTERN.test(value), "Enter an amount such as 1250.50.");

export const VARIANT_FORM_SCHEMA = z.object({
  sku: z.string().trim().min(1, "Enter a SKU.").max(64, "Use at most 64 characters."),
  size_id: z.uuid("Choose a size."),
  shade_id: z.uuid().nullable(),
  stock_quantity: z.coerce
    .number<string | number>()
    .int("Use a whole number.")
    .min(0, "Use 0 or more."),
  price_override: OPTIONAL_AMOUNT,
  compare_at_price: OPTIONAL_AMOUNT,
});

export type VariantFormValues = z.infer<typeof VARIANT_FORM_SCHEMA>;
