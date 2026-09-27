import { type QueryKey, queryOptions } from "@tanstack/react-query";

import type { Page, Product, ProductListItem } from "@/lib/api/types";
import { type ProductFilters, productsHref } from "@/lib/products/query";
import { getJson } from "@/lib/query/fetch-json";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};

export const productQueries = {
  // The Route Handler reads the admin's own URL filters, so the list page's link is
  // also the request.
  list: (filters: ProductFilters) =>
    queryOptions({
      queryKey: productKeys.list(filters),
      queryFn: ({ signal }) =>
        getJson<Page<ProductListItem>>(`/api${productsHref(filters)}`, undefined, signal),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: productKeys.detail(id),
      queryFn: ({ signal }) =>
        getJson<Product>(`/api/products/${encodeURIComponent(id)}`, undefined, signal),
    }),
};

// A list row shows the product's primary image, prices and stock, so any edit to one
// product makes the lists stale too.
export function productInvalidates(id: string): QueryKey[] {
  return [productKeys.detail(id), productKeys.lists()];
}
