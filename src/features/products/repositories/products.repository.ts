import { httpClient } from "@/lib/repositories/client";
import { DEFAULT_PAGE_SIZE, paginatedSchema, toListParams } from "@/lib/repositories/pagination";

import type { ProductFilters } from "../schemas/product-filters.schema";
import { PRODUCT_LIST_ITEM_SCHEMA, PRODUCT_SCHEMA, type Product } from "../schemas/product.schema";

const PRODUCT_PAGE_SCHEMA = paginatedSchema(PRODUCT_LIST_ITEM_SCHEMA);

const PUBLISHED = { yes: true, no: false } as const;

export async function listProducts(filters: ProductFilters) {
  const response = await httpClient.get("admin/products/", {
    params: {
      search: filters.q,
      brand: filters.brand,
      category: filters.category,
      is_published: filters.published === undefined ? undefined : PUBLISHED[filters.published],
      low_stock: filters.stock === "low" ? true : undefined,
      on_sale: filters.on_sale,
      ...toListParams({
        pagination: { pageIndex: (filters.page ?? 1) - 1, pageSize: DEFAULT_PAGE_SIZE },
        sorting: [{ id: "name", desc: false }],
      }),
    },
  });
  return PRODUCT_PAGE_SCHEMA.parse(response.data);
}

export async function getProduct(id: string): Promise<Product> {
  const response = await httpClient.get(`admin/products/${id}/`);
  return PRODUCT_SCHEMA.parse(response.data);
}

export async function createProduct(body: object): Promise<Product> {
  const response = await httpClient.post("admin/products/", body);
  return PRODUCT_SCHEMA.parse(response.data);
}

export async function updateProduct(id: string, body: object): Promise<Product> {
  const response = await httpClient.patch(`admin/products/${id}/`, body);
  return PRODUCT_SCHEMA.parse(response.data);
}

export async function deleteProduct(id: string): Promise<void> {
  await httpClient.delete(`admin/products/${id}/`);
}
