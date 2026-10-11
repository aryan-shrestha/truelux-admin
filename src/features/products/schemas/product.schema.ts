import { z } from "zod";

const REF_SCHEMA = z.object({ id: z.uuid(), name: z.string() });

export const VARIANT_SCHEMA = z.object({
  id: z.uuid(),
  sku: z.string(),
  size: REF_SCHEMA,
  shade: REF_SCHEMA.extend({ hex_code: z.string() }).nullable(),
  stock_quantity: z.number().int(),
  price_override: z.string().nullable(),
  price: z.string(),
  compare_at_price: z.string().nullable(),
  on_sale: z.boolean(),
  discount_percent: z.number().int().nullable(),
});

export type Variant = z.infer<typeof VARIANT_SCHEMA>;

export const IMAGE_SCHEMA = z.object({
  id: z.uuid(),
  // Absolute on Cloudinary; relative /media/ in development until the back-end makes it
  // absolute (taxonomy.md#remaining). A plain string, so neither fails the parse.
  url: z.string(),
  alt_text: z.string(),
  sort_order: z.number().int(),
  is_primary: z.boolean(),
});

export type ProductImage = z.infer<typeof IMAGE_SCHEMA>;

const PRODUCT_BASE_SCHEMA = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  brand: REF_SCHEMA,
  category: REF_SCHEMA,
  base_price: z.string(),
  is_published: z.boolean(),
  sort_order: z.number().int(),
});

export const PRODUCT_LIST_ITEM_SCHEMA = PRODUCT_BASE_SCHEMA.extend({
  variant_count: z.number().int(),
  total_stock: z.number().int(),
  on_sale: z.boolean(),
  primary_image_url: z.string().nullable(),
});

export type ProductListItem = z.infer<typeof PRODUCT_LIST_ITEM_SCHEMA>;

export const PRODUCT_SCHEMA = PRODUCT_BASE_SCHEMA.extend({
  description: z.string(),
  skin_types: z.array(REF_SCHEMA),
  skin_feel: z.string(),
  key_ingredients: z.string(),
  variants: z.array(VARIANT_SCHEMA),
  images: z.array(IMAGE_SCHEMA),
});

export type Product = z.infer<typeof PRODUCT_SCHEMA>;
