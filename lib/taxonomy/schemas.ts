import { z } from "zod";

import { HEX_PATTERN, nameField, slugField, sortOrderField } from "@/lib/catalog/fields";

export const brandSchema = z.object({
  name: nameField,
  slug: slugField,
  description: z.string().trim(),
  is_active: z.boolean(),
  sort_order: sortOrderField,
  logo: z
    .instanceof(File)
    .refine((file) => file.type.startsWith("image/"), "Choose an image file.")
    .nullable(),
});

export const categorySchema = z.object({
  name: nameField,
  slug: slugField,
  parent_id: z.string().nullable(),
  sort_order: sortOrderField,
});

export const shadeSchema = z.object({
  name: nameField,
  slug: slugField,
  hex_code: z.string().trim().regex(HEX_PATTERN, "Use a hex colour like #D8A47F."),
  sort_order: sortOrderField,
});

export const sizeSchema = z.object({
  name: nameField,
  slug: slugField,
  sort_order: sortOrderField,
});

export type BrandValues = z.infer<typeof brandSchema>;
export type CategoryValues = z.infer<typeof categorySchema>;
export type ShadeValues = z.infer<typeof shadeSchema>;
export type SizeValues = z.infer<typeof sizeSchema>;
