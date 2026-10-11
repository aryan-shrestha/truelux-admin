import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { FRESHNESS } from "@/lib/freshness";

import { getProduct, listProducts } from "../repositories/products.repository";
import type { ProductFilters } from "../schemas/product-filters.schema";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters: ProductFilters) => [...productKeys.lists(), filters] as const,
  detail: (id: string) => [...productKeys.all, "detail", id] as const,
};

// Stock moves with storefront orders, so products are `volatile`.
export const productQueries = {
  list: (filters: ProductFilters) =>
    queryOptions({
      queryKey: productKeys.list(filters),
      queryFn: () => listProducts(filters),
      placeholderData: keepPreviousData,
      ...FRESHNESS.volatile,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: productKeys.detail(id),
      queryFn: () => getProduct(id),
      ...FRESHNESS.volatile,
    }),
};
