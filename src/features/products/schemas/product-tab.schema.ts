import { z } from "zod";

export const PRODUCT_TAB_SCHEMA = z.object({
  tab: z.enum(["details", "variants"]).optional().catch(undefined),
});

export type ProductTab = NonNullable<z.infer<typeof PRODUCT_TAB_SCHEMA>["tab"]>;
