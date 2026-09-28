import { queryOptions } from "@tanstack/react-query";

import type { OrderDetail, OrderListItem, Page } from "@/lib/api/types";
import { type OrderFilters, ordersHref } from "@/lib/orders/query";
import { FRESHNESS } from "@/lib/query/client";
import { getJson } from "@/lib/query/get-json";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export const orderQueries = {
  // The Route Handler reads the admin's own URL filters, so the list page's link is
  // also the request.
  list: (filters: OrderFilters) =>
    queryOptions({
      queryKey: orderKeys.list(filters),
      queryFn: ({ signal }) =>
        getJson<Page<OrderListItem>>(`/api${ordersHref(filters)}`, undefined, signal),
      ...FRESHNESS.live,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: orderKeys.detail(id),
      queryFn: ({ signal }) =>
        getJson<OrderDetail>(`/api/orders/${encodeURIComponent(id)}`, undefined, signal),
      ...FRESHNESS.live,
    }),
};
