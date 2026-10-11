import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { FRESHNESS } from "@/lib/freshness";

import { getOrder, listOrders } from "../repositories/orders.repository";
import type { OrderFilters } from "../schemas/order-filters.schema";

export const orderKeys = {
  all: ["orders"] as const,
  lists: () => [...orderKeys.all, "list"] as const,
  list: (filters: OrderFilters) => [...orderKeys.lists(), filters] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

export const orderQueries = {
  list: (filters: OrderFilters) =>
    queryOptions({
      queryKey: orderKeys.list(filters),
      queryFn: () => listOrders(filters),
      placeholderData: keepPreviousData,
      ...FRESHNESS.live,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: orderKeys.detail(id),
      queryFn: () => getOrder(id),
      ...FRESHNESS.live,
    }),
};
