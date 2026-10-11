import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";

import { taxonomyKeys } from "@/features/taxonomy";

import { createProduct, deleteProduct, updateProduct } from "../repositories/products.repository";
import type { ProductListItem } from "../schemas/product.schema";
import { productKeys } from "./products.queries";

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
