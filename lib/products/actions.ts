"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

function revalidateProduct(id: string) {
  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
}

export async function createProductAction(input: ProductValues): Promise<ActionResult<Product>> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const result = await attempt(() => createProduct(withoutBlankSlug(parsed.data)));
  if (!result.ok) return result;
  revalidatePath("/products");
  redirect(`/products/${result.data.id}?tab=variants`);
}

export async function updateProductAction(
  id: string,
  input: ProductValues,
): Promise<ActionResult<Product>> {
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const result = await attempt(() => updateProduct({ id, ...withoutBlankSlug(parsed.data) }));
  if (result.ok) revalidateProduct(id);
  return result;
}

export async function setPublished(id: string, isPublished: boolean): Promise<ActionResult<Product>> {
  const result = await attempt(() => updateProduct({ id, is_published: Boolean(isPublished) }));
  if (result.ok) revalidateProduct(id);
  return result;
}

export async function removeProduct(id: string): Promise<ActionResult<null>> {
  const result = await attempt(() => deleteProduct({ id }));
  if (!result.ok) return result;
  revalidatePath("/products");
  return { ok: true, data: null };
}

export async function addVariant(
  productId: string,
  input: VariantInput,
): Promise<ActionResult<Variant>> {
  const parsed = variantSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const result = await attempt(() => createVariant({ productId, ...parsed.data }));
  if (result.ok) revalidateProduct(productId);
  return result;
}

export async function saveVariant(
  productId: string,
  id: string,
  input: VariantInput,
): Promise<ActionResult<Variant>> {
  const parsed = variantSchema.safeParse(input);
  if (!parsed.success) return invalidInput();
  const result = await attempt(() => updateVariant({ id, ...parsed.data }));
  if (result.ok) revalidateProduct(productId);
  return result;
}

export async function removeVariant(productId: string, id: string): Promise<ActionResult<null>> {
  const result = await attempt(() => deleteVariant({ id }));
  if (!result.ok) return result;
  revalidateProduct(productId);
  return { ok: true, data: null };
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
  const result = await attempt(() => uploadProductImage({ productId, form }));
  if (result.ok) revalidateProduct(productId);
  return result;
}

const imagePatchSchema = z
  .object({
    alt_text: z.string().trim().max(255),
    sort_order: z.number().int().min(0),
    is_primary: z.literal(true),
  })
  .partial();

export async function updateImage(
  productId: string,
  id: string,
  patch: z.input<typeof imagePatchSchema>,
): Promise<ActionResult<ProductImage>> {
  const parsed = imagePatchSchema.safeParse(patch);
  if (!parsed.success) return invalidInput();
  const result = await attempt(() => updateProductImage({ id, ...parsed.data }));
  if (result.ok) revalidateProduct(productId);
  return result;
}

const imageOrderSchema = z.array(z.object({ id: z.string(), sort_order: z.number().int().min(0) }));

export async function reorderImages(
  productId: string,
  order: z.input<typeof imageOrderSchema>,
): Promise<ActionResult<null>> {
  const parsed = imageOrderSchema.safeParse(order);
  if (!parsed.success) return invalidInput();
  for (const { id, sort_order } of parsed.data) {
    const result = await attempt(() => updateProductImage({ id, sort_order }));
    if (!result.ok) return result;
  }
  revalidateProduct(productId);
  return { ok: true, data: null };
}

export async function removeImage(productId: string, id: string): Promise<ActionResult<null>> {
  const result = await attempt(() => deleteProductImage({ id }));
  if (!result.ok) return result;
  revalidateProduct(productId);
  return { ok: true, data: null };
}
