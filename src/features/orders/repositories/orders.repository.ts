import { httpClient } from "@/lib/repositories/client";
import { DEFAULT_PAGE_SIZE, paginatedSchema, toListParams } from "@/lib/repositories/pagination";

import type { OrderFilters } from "../schemas/order-filters.schema";
import type { OrderStatus } from "../schemas/order-status.schema";
import { ORDER_LIST_ITEM_SCHEMA, ORDER_SCHEMA, type Order } from "../schemas/order.schema";

const ORDER_PAGE_SCHEMA = paginatedSchema(ORDER_LIST_ITEM_SCHEMA);

export async function listOrders(filters: OrderFilters) {
  const response = await httpClient.get("admin/orders/", {
    params: {
      status: filters.status,
      search: filters.q || undefined,
      created_after: filters.from,
      created_before: filters.to,
      ...toListParams({
        pagination: { pageIndex: (filters.page ?? 1) - 1, pageSize: DEFAULT_PAGE_SIZE },
      }),
    },
  });
  return ORDER_PAGE_SCHEMA.parse(response.data);
}

export async function getOrder(id: string): Promise<Order> {
  const response = await httpClient.get(`admin/orders/${id}/`);
  return ORDER_SCHEMA.parse(response.data);
}

export async function transitionOrder(id: string, to: OrderStatus): Promise<Order> {
  const response = await httpClient.post(`admin/orders/${id}/transition/`, { to });
  return ORDER_SCHEMA.parse(response.data);
}
