import type { ProductQuery } from "@/lib/api/types";
import { type SearchParams, firstParam, pageParam, queryParam } from "@/lib/search-params";

export const PRODUCTS_PAGE_SIZE = 25;

export type ProductFilters = {
  q: string;
  brand: string | undefined;
  category: string | undefined;
  published: "yes" | "no" | undefined;
  lowStock: boolean;
  page: number;
};

export function parseProductFilters(params: SearchParams): ProductFilters {
  const published = firstParam(params.published);
  return {
    q: queryParam(params),
    brand: firstParam(params.brand) || undefined,
    category: firstParam(params.category) || undefined,
    published: published === "yes" || published === "no" ? published : undefined,
    lowStock: firstParam(params.stock) === "low",
    page: pageParam(params),
  };
}

export function toProductQuery(filters: ProductFilters): ProductQuery {
  return {
    search: filters.q || undefined,
    brand: filters.brand,
    category: filters.category,
    is_published: filters.published === undefined ? undefined : filters.published === "yes",
    low_stock: filters.lowStock || undefined,
    ordering: "name",
    limit: PRODUCTS_PAGE_SIZE,
    offset: (filters.page - 1) * PRODUCTS_PAGE_SIZE,
  };
}

export function productsHref(filters: ProductFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.brand) params.set("brand", filters.brand);
  if (filters.category) params.set("category", filters.category);
  if (filters.published) params.set("published", filters.published);
  if (filters.lowStock) params.set("stock", "low");
  if (filters.page > 1) params.set("page", String(filters.page));
  const search = params.toString();
  return search ? `/products?${search}` : "/products";
}
