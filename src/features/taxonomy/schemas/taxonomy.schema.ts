import { z } from "zod";

export const BRAND_SCHEMA = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  // Absolute in production (Cloudinary). The back-end is to make it absolute in every
  // environment; until then a development logo is a relative /media/ path, which the
  // admin cannot load but must not fail to parse.
  logo_url: z.string().nullable(),
  is_active: z.boolean(),
  sort_order: z.number().int(),
  product_count: z.number().int(),
});

export const CATEGORY_SCHEMA = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  parent_id: z.uuid().nullable(),
  sort_order: z.number().int(),
  product_count: z.number().int(),
});

export const SHADE_SCHEMA = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  hex_code: z.string(),
  sort_order: z.number().int(),
  variant_count: z.number().int(),
});

export const SIZE_SCHEMA = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  sort_order: z.number().int(),
  variant_count: z.number().int(),
});

export const SKIN_TYPE_SCHEMA = z.object({
  id: z.uuid(),
  name: z.string(),
  slug: z.string(),
  sort_order: z.number().int(),
  product_count: z.number().int(),
});

export type Brand = z.infer<typeof BRAND_SCHEMA>;
export type Category = z.infer<typeof CATEGORY_SCHEMA>;
export type Shade = z.infer<typeof SHADE_SCHEMA>;
export type Size = z.infer<typeof SIZE_SCHEMA>;
export type SkinType = z.infer<typeof SKIN_TYPE_SCHEMA>;

// The API path segment of each kind. Lists are bare arrays, not paginated.
export const TAXONOMY_SCHEMAS = {
  brands: BRAND_SCHEMA,
  categories: CATEGORY_SCHEMA,
  shades: SHADE_SCHEMA,
  sizes: SIZE_SCHEMA,
  "skin-types": SKIN_TYPE_SCHEMA,
} as const;

export type TaxonomyKind = keyof typeof TAXONOMY_SCHEMAS;

export type TaxonomyEntry<K extends TaxonomyKind> = z.infer<(typeof TAXONOMY_SCHEMAS)[K]>;
