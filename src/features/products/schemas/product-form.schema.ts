import { z } from "zod";

import { MONEY_PATTERN } from "@/lib/money";

export const PRODUCT_FORM_SCHEMA = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(200, "Use at most 200 characters."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Use lowercase letters, digits and hyphens."),
  description: z.string(),
  brand_id: z.uuid("Choose a brand."),
  category_id: z.uuid("Choose a category."),
  base_price: z.string().trim().regex(MONEY_PATTERN, "Enter an amount such as 1250 or 1250.50."),
  sort_order: z.coerce
    .number<string | number>()
    .int("Use a whole number.")
    .min(0, "Use 0 or more."),
  skin_type_ids: z.array(z.uuid()),
  skin_feel: z.string().max(200, "Use at most 200 characters."),
  key_ingredients: z.string(),
});

export type ProductFormValues = z.infer<typeof PRODUCT_FORM_SCHEMA>;
