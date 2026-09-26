import "server-only";

import { apiRead, apiWrite } from "@/lib/api/client";
import { mediaUrl } from "@/lib/api/media";
import type {
  ImageUpdate,
  Page,
  Product,
  ProductImage,
  ProductListItem,
  ProductQuery,
  ProductWrite,
  Variant,
  VariantWrite,
} from "@/lib/api/types";

function productPath(id: string): string {
  return `/admin/products/${encodeURIComponent(id)}/`;
}

function withImageUrl(image: ProductImage): ProductImage {
  return { ...image, url: mediaUrl(image.url) };
}

function withImageUrls(product: Product): Product {
  return { ...product, images: product.images.map(withImageUrl) };
}

export async function listProducts(query: ProductQuery): Promise<Page<ProductListItem>> {
  const page = await apiRead<Page<ProductListItem>>("/admin/products/", query);
  return {
    ...page,
    results: page.results.map((product) => ({
      ...product,
      primary_image_url: product.primary_image_url && mediaUrl(product.primary_image_url),
    })),
  };
}

export async function getProduct({ id }: { id: string }): Promise<Product> {
  return withImageUrls(await apiRead<Product>(productPath(id)));
}

export async function createProduct(body: ProductWrite): Promise<Product> {
  return withImageUrls(await apiWrite<Product>("/admin/products/", { method: "POST", body }));
}

export async function updateProduct({
  id,
  ...body
}: Partial<ProductWrite> & { id: string }): Promise<Product> {
  return withImageUrls(await apiWrite<Product>(productPath(id), { method: "PATCH", body }));
}

export async function deleteProduct({ id }: { id: string }): Promise<void> {
  return apiWrite<void>(productPath(id), { method: "DELETE" });
}

export async function createVariant({
  productId,
  ...body
}: VariantWrite & { productId: string }): Promise<Variant> {
  return apiWrite<Variant>(`${productPath(productId)}variants/`, { method: "POST", body });
}

export async function updateVariant({
  id,
  ...body
}: Partial<VariantWrite> & { id: string }): Promise<Variant> {
  return apiWrite<Variant>(`/admin/variants/${encodeURIComponent(id)}/`, {
    method: "PATCH",
    body,
  });
}

export async function deleteVariant({ id }: { id: string }): Promise<void> {
  return apiWrite<void>(`/admin/variants/${encodeURIComponent(id)}/`, { method: "DELETE" });
}

export async function uploadProductImage({
  productId,
  form,
}: {
  productId: string;
  form: FormData;
}): Promise<ProductImage> {
  return withImageUrl(
    await apiWrite<ProductImage>(`${productPath(productId)}images/`, {
      method: "POST",
      body: form,
    }),
  );
}

export async function updateProductImage({
  id,
  ...body
}: ImageUpdate & { id: string }): Promise<ProductImage> {
  return withImageUrl(
    await apiWrite<ProductImage>(`/admin/images/${encodeURIComponent(id)}/`, {
      method: "PATCH",
      body,
    }),
  );
}

export async function deleteProductImage({ id }: { id: string }): Promise<void> {
  return apiWrite<void>(`/admin/images/${encodeURIComponent(id)}/`, { method: "DELETE" });
}
