import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

import { dashboardKeys } from "@/features/dashboard";
import { taxonomyKeys } from "@/features/taxonomy";

import { moveImage } from "../image-order";
import {
  adjustStock,
  createProduct,
  createVariant,
  deleteImage,
  deleteProduct,
  deleteVariant,
  updateImage,
  updateProduct,
  updateVariant,
  uploadImage,
} from "../repositories/products.repository";
import type { Product, ProductImage, ProductListItem } from "../schemas/product.schema";
import { toStockChange, type StockChangeValues } from "../schemas/stock-change.schema";
import { productKeys, stockKeys } from "./products.queries";

type ProductPage = { count: number; results: ProductListItem[] };

// The taxonomy lists count products, so a product change leaves them stale too.
const AFTER_PRODUCT_CHANGE = [productKeys.lists(), taxonomyKeys.all] as const;

export function useSaveProduct(id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: object) => (id === null ? createProduct(body) : updateProduct(id, body)),
    meta: { invalidates: AFTER_PRODUCT_CHANGE },
    onSuccess: (product) => queryClient.setQueryData(productKeys.detail(product.id), product),
  });
}

// Shown at once in every cached list, and put back if the API refuses (publishing a
// product without variants, for one).
export function useSetPublished() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublished }: { id: string; isPublished: boolean }) =>
      updateProduct(id, { is_published: isPublished }),
    meta: { invalidates: [productKeys.lists()] },
    onMutate: async ({ id, isPublished }) => {
      await queryClient.cancelQueries({ queryKey: productKeys.lists() });
      const previous = queryClient.getQueriesData<ProductPage>({ queryKey: productKeys.lists() });
      queryClient.setQueriesData<ProductPage>({ queryKey: productKeys.lists() }, (page) =>
        page === undefined
          ? page
          : {
              ...page,
              results: page.results.map((product) =>
                product.id === id ? { ...product, is_published: isPublished } : product,
              ),
            },
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      for (const [queryKey, page] of context?.previous ?? []) {
        queryClient.setQueryData(queryKey as QueryKey, page);
      }
      return queryClient.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onSuccess: (product) => queryClient.setQueryData(productKeys.detail(product.id), product),
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    meta: { invalidates: AFTER_PRODUCT_CHANGE },
    onSuccess: (_data, id) => queryClient.removeQueries({ queryKey: productKeys.detail(id) }),
  });
}

// A variant changes its product, the lists (variant count, stock), the size and shade
// counts in taxonomy, the dashboard's low-stock list and stock history (an opening
// stock is a movement).
function afterVariantChange(productId: string) {
  return [
    productKeys.detail(productId),
    productKeys.lists(),
    taxonomyKeys.all,
    dashboardKeys.all,
    stockKeys.all,
  ];
}

export function useSaveVariant(productId: string, variantId: string | null) {
  return useMutation({
    mutationFn: (body: object) =>
      variantId === null ? createVariant(productId, body) : updateVariant(variantId, body),
    meta: { invalidates: afterVariantChange(productId) },
  });
}

export function useDeleteVariant(productId: string) {
  return useMutation({
    mutationFn: (variantId: string) => deleteVariant(variantId),
    meta: { invalidates: afterVariantChange(productId) },
  });
}

// An image change shows on the product and, through its primary image, in the lists.
function afterImageChange(productId: string) {
  return [productKeys.detail(productId), productKeys.lists()];
}

// One request per file, in order, so a large batch never competes with itself. The
// first upload becomes the primary image when the product has none.
export function useUploadImages(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ files, hasPrimary }: { files: readonly File[]; hasPrimary: boolean }) => {
      for (const [index, file] of files.entries()) {
        const form = new FormData();
        form.set("image", file);
        form.set("is_primary", String(!hasPrimary && index === 0));
        await uploadImage(productId, form);
      }
    },
    meta: { invalidates: afterImageChange(productId) },
    // Files uploaded before a failure are kept, so the product is refetched either way.
    onError: () => queryClient.invalidateQueries({ queryKey: productKeys.detail(productId) }),
  });
}

// Shows the change at once on the product, puts it back if the API refuses, and
// refetches either way.
function useOptimisticImages<TVariables>(
  productId: string,
  mutationFn: (variables: TVariables) => Promise<unknown>,
  apply: (images: ProductImage[], variables: TVariables) => ProductImage[],
) {
  const queryClient = useQueryClient();
  const detailKey = productKeys.detail(productId);
  return useMutation({
    mutationFn,
    meta: { invalidates: afterImageChange(productId) },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: detailKey });
      const previous = queryClient.getQueryData<Product>(detailKey);
      if (previous !== undefined) {
        queryClient.setQueryData<Product>(detailKey, {
          ...previous,
          images: apply(previous.images, variables),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) queryClient.setQueryData(detailKey, context.previous);
      return queryClient.invalidateQueries({ queryKey: detailKey });
    },
  });
}

export function useUpdateImageAlt(productId: string) {
  return useOptimisticImages(
    productId,
    ({ id, altText }: { id: string; altText: string }) => updateImage(id, { alt_text: altText }),
    (images, { id, altText }) =>
      images.map((image) => (image.id === id ? { ...image, alt_text: altText } : image)),
  );
}

// Each changed number is its own PATCH, sent in sequence (image-order.ts).
export function useMoveImage(productId: string) {
  return useOptimisticImages(
    productId,
    async ({ images, from, to }: { images: readonly ProductImage[]; from: number; to: number }) => {
      for (const change of moveImage(images, from, to).changes) {
        await updateImage(change.id, { sort_order: change.sort_order });
      }
    },
    (_images, { images, from, to }) => moveImage(images, from, to).images,
  );
}

// Not optimistic: the API clears the old primary in the same step.
export function useMakeImagePrimary(productId: string) {
  return useMutation({
    mutationFn: (id: string) => updateImage(id, { is_primary: true }),
    meta: { invalidates: afterImageChange(productId) },
  });
}

export function useDeleteImage(productId: string) {
  return useMutation({
    mutationFn: (id: string) => deleteImage(id),
    meta: { invalidates: afterImageChange(productId) },
  });
}

// An adjustment is relative, so it cannot overwrite a sale made meanwhile; a count is
// the variant's absolute stock, recorded by the API as a stocktake.
export function useChangeStock(productId: string, variantId: string) {
  return useMutation({
    mutationFn: async (values: StockChangeValues) => {
      const change = toStockChange(values);
      if (change.kind === "count") await updateVariant(variantId, change.body);
      else await adjustStock(variantId, change.body);
    },
    meta: {
      invalidates: [
        productKeys.detail(productId),
        productKeys.lists(),
        dashboardKeys.all,
        stockKeys.variant(variantId),
      ],
    },
  });
}
