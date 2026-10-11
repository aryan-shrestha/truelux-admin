import { z } from "zod";

// Each field falls back on its own, so a hand-edited URL never breaks the page.
export const PRODUCT_FILTERS_SCHEMA = z.object({
  q: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .optional()
    .catch(undefined),
  brand: z.uuid().optional().catch(undefined),
  category: z.uuid().optional().catch(undefined),
  published: z.enum(["yes", "no"]).optional().catch(undefined),
  stock: z.literal("low").optional().catch(undefined),
  // `?on_sale=true` reaches the schema as a boolean: the router parses search values.
  on_sale: z.literal(true).optional().catch(undefined),
  page: z.coerce.number().int().min(1).optional().catch(undefined),
});

export type ProductFilters = z.infer<typeof PRODUCT_FILTERS_SCHEMA>;
