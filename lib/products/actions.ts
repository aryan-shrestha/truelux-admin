"use server";

import { z } from "zod";

import { type ActionResult, attempt, invalidInput } from "@/lib/actions/attempt";
import {
  createProduct,
  createVariant,
  deleteProduct,
  deleteProductImage,
  deleteVariant,
  updateProduct,
  updateProductImage,
  updateVariant,
  uploadProductImage,
} from "@/lib/api/products";
import type { Product, ProductImage, Variant } from "@/lib/api/types";
import { withoutBlankSlug } from "@/lib/catalog/fields";
import {
  type ImageUploadValues,
  type ProductValues,
  type VariantInput,
  imageUploadSchema,
  productSchema,
  variantSchema,
} from "@/lib/products/schemas";

export async function createProductAction(input: ProductValues): Promise<ActionResult<Product>> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  return attempt(() => createProduct(withoutBlankSlug(parsed.data)));
}

export async function updateProductAction(
  id: string,
  input: ProductValues,
): Promise<ActionResult<Product>> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  return attempt(() => updateProduct({ id, ...withoutBlankSlug(parsed.data) }));
}

export async function setPublished(
  id: string,
  isPublished: boolean,
): Promise<ActionResult<Product>> {
  return attempt(() => updateProduct({ id, is_published: Boolean(isPublished) }));
}

export async function removeProduct(id: string): Promise<ActionResult<null>> {
  const result = await attempt(() => deleteProduct({ id }));
  return result.ok ? { ok: true, data: null } : result;
}

export async function addVariant(
  productId: string,
  input: VariantInput,
): Promise<ActionResult<Variant>> {
  const parsed = variantSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  return attempt(() => createVariant({ productId, ...parsed.data }));
}

export async function saveVariant(id: string, input: VariantInput): Promise<ActionResult<Variant>> {
  const parsed = variantSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  return attempt(() => updateVariant({ id, ...parsed.data }));
}

export async function removeVariant(id: string): Promise<ActionResult<null>> {
  const result = await attempt(() => deleteVariant({ id }));
  return result.ok ? { ok: true, data: null } : result;
}

export async function uploadImage(
  productId: string,
  input: ImageUploadValues,
): Promise<ActionResult<ProductImage>> {
  const parsed = imageUploadSchema.safeParse(input);
  if (!parsed.success) {
    return { ...invalidInput(), message: parsed.error.issues[0]?.message ?? "Check the image." };
  }
  const form = new FormData();
  form.set("image", parsed.data.file);
  form.set("alt_text", parsed.data.alt_text);
  form.set("is_primary", String(parsed.data.is_primary));
  return attempt(() => uploadProductImage({ productId, form }));
}

const imagePatchSchema = z
  .object({
    alt_text: z.string().trim().max(255),
    sort_order: z.number().int().min(0),
    is_primary: z.literal(true),
  })
  .partial();

export async function updateImage(
  id: string,
  patch: z.input<typeof imagePatchSchema>,
): Promise<ActionResult<ProductImage>> {
  const parsed = imagePatchSchema.safeParse(patch);
  if (!parsed.success) return invalidInput();
  return attempt(() => updateProductImage({ id, ...parsed.data }));
}

const imageOrderSchema = z.array(z.object({ id: z.string(), sort_order: z.number().int().min(0) }));

export async function reorderImages(
  order: z.input<typeof imageOrderSchema>,
): Promise<ActionResult<null>> {
  const parsed = imageOrderSchema.safeParse(order);
  if (!parsed.success) return invalidInput();
  for (const { id, sort_order } of parsed.data) {
    const result = await attempt(() => updateProductImage({ id, sort_order }));
    if (!result.ok) return result;
  }
  return { ok: true, data: null };
}

export async function removeImage(id: string): Promise<ActionResult<null>> {
  const result = await attempt(() => deleteProductImage({ id }));
  return result.ok ? { ok: true, data: null } : result;
}
