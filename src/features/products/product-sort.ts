import type { SortingState } from "@tanstack/react-table";

import { PRODUCT_SORT_SCHEMA, type ProductSort } from "./schemas/product-filters.schema";

// The URL's `sort` is the API's `ordering`; no `sort` is the API list's own default,
// name A to Z, which the table shows as sorted.
export function toSorting(sort: ProductSort | undefined): SortingState {
  const ordering = sort ?? "name";
  return ordering.startsWith("-")
    ? [{ id: ordering.slice(1), desc: true }]
    : [{ id: ordering, desc: false }];
}

export function toProductSort(sorting: SortingState): ProductSort | undefined {
  const [column] = sorting;
  if (column === undefined) return undefined;
  const sort = PRODUCT_SORT_SCHEMA.catch("name").parse(`${column.desc ? "-" : ""}${column.id}`);
  return sort === "name" ? undefined : sort;
}
