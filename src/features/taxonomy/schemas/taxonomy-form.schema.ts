import { z } from "zod";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const LOGO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

// Field rules shared by every kind; the API enforces them again.
function nameField(maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(maxLength, `Use at most ${maxLength} characters.`);
}

const SLUG_FIELD = z
  .string()
  .trim()
  .regex(/^[a-z0-9-]*$/, "Use lowercase letters, digits and hyphens.");

const SORT_ORDER_FIELD = z.coerce
  .number<string | number>()
  .int("Use a whole number.")
  .min(0, "Use 0 or more.");

export const BRAND_FORM_SCHEMA = z.object({
  name: nameField(150),
  slug: SLUG_FIELD,
  description: z.string(),
  logo: z
    .instanceof(File)
    .refine((file) => LOGO_TYPES.includes(file.type), "Use a JPEG, PNG or WebP image.")
    .refine((file) => file.size <= MAX_LOGO_BYTES, "Images must be 5 MB or smaller.")
    .nullable(),
  is_active: z.boolean(),
  sort_order: SORT_ORDER_FIELD,
});

export const CATEGORY_FORM_SCHEMA = z.object({
  name: nameField(150),
  slug: SLUG_FIELD,
  parent_id: z.uuid().nullable(),
  sort_order: SORT_ORDER_FIELD,
});

export const SHADE_FORM_SCHEMA = z.object({
  name: nameField(50),
  slug: SLUG_FIELD,
  hex_code: z.string().trim().regex(HEX_PATTERN, "Use the #RRGGBB form."),
  sort_order: SORT_ORDER_FIELD,
});

export const SIZE_FORM_SCHEMA = z.object({
  name: nameField(50),
  slug: SLUG_FIELD,
  sort_order: SORT_ORDER_FIELD,
});

export const SKIN_TYPE_FORM_SCHEMA = SIZE_FORM_SCHEMA;

export type BrandFormValues = z.infer<typeof BRAND_FORM_SCHEMA>;
export type CategoryFormValues = z.infer<typeof CATEGORY_FORM_SCHEMA>;
export type ShadeFormValues = z.infer<typeof SHADE_FORM_SCHEMA>;
export type SizeFormValues = z.infer<typeof SIZE_FORM_SCHEMA>;
export type SkinTypeFormValues = z.infer<typeof SKIN_TYPE_FORM_SCHEMA>;
