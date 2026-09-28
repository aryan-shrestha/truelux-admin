import { z } from "zod";

import { nameField, slugField, sortOrderField } from "@/lib/catalog/fields";
import { MONEY_PATTERN } from "@/lib/format/money";

const PRICE_MESSAGE = "Enter an amount like 3200 or 3200.50.";

export const productSchema = z.object({
  name: nameField,
  slug: slugField,
  description: z.string().trim(),
  brand_id: z.string({ error: "Choose a brand." }).min(1, "Choose a brand."),
  category_id: z.string({ error: "Choose a category." }).min(1, "Choose a category."),
  base_price: z.string().trim().regex(MONEY_PATTERN, PRICE_MESSAGE),
  is_published: z.boolean(),
  sort_order: sortOrderField,
  skin_type_ids: z.array(z.string().min(1)),
  skin_feel: z.string().trim().max(200, "Keep it under 200 characters."),
  key_ingredients: z.string().trim(),
});

const optionalPrice = z
  .string()
  .trim()
  .nullable()
  .transform((value) => (value === "" ? null : value))
  .refine((value) => value === null || MONEY_PATTERN.test(value), PRICE_MESSAGE)
  .refine((value) => value === null || /[1-9]/.test(value), "Must be more than 0, or blank.");

export const variantSchema = z.object({
  sku: z.string().trim().min(1, "Enter a SKU.").max(64, "Keep it under 64 characters."),
  size_id: z.string({ error: "Choose a size." }).min(1, "Choose a size."),
  shade_id: z.string().nullable(),
  stock_quantity: z
    .number({ error: "Enter a whole number." })
    .int("Enter a whole number.")
    .min(0, "Stock cannot be negative."),
  price_override: optionalPrice,
  compare_at_price: optionalPrice,
});

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => IMAGE_TYPES.includes(file.type), "Use a JPEG, PNG or WebP image.")
    .refine((file) => file.size <= MAX_IMAGE_BYTES, "Images must be 5 MB or smaller."),
  alt_text: z.string().trim().max(255),
  is_primary: z.boolean(),
});

export type ProductValues = z.infer<typeof productSchema>;
export type VariantInput = z.input<typeof variantSchema>;
export type VariantValues = z.output<typeof variantSchema>;
export type ImageUploadValues = z.infer<typeof imageUploadSchema>;
