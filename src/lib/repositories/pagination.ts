import type { PaginationState, SortingState } from "@tanstack/react-table";
import { z } from "zod";

// Mirrors DefaultLimitOffsetPagination in back-end/apps/core/pagination.py.
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export function paginatedSchema<TItem extends z.ZodType>(item: TItem) {
  return z.object({
    count: z.number().int().nonnegative(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(item),
  });
}

export interface ListParams {
  limit: number;
  offset: number;
  ordering?: string;
}

export function toListParams({
  pagination,
  sorting = [],
}: {
  pagination: PaginationState;
  sorting?: SortingState;
}): ListParams {
  const limit = Math.min(pagination.pageSize, MAX_PAGE_SIZE);
  const params: ListParams = { limit, offset: pagination.pageIndex * limit };
  if (sorting.length > 0) {
    params.ordering = sorting.map(({ id, desc }) => (desc ? `-${id}` : id)).join(",");
  }
  return params;
}
