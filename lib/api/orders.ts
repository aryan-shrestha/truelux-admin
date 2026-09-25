import "server-only";

import { apiRead, apiWrite } from "@/lib/api/client";
import type { OrderDetail, OrderListItem, OrderQuery, OrderStatus, Page } from "@/lib/api/types";

export async function listOrders(query: OrderQuery): Promise<Page<OrderListItem>> {
  return apiRead<Page<OrderListItem>>("/admin/orders/", query);
}

export async function getOrder({ id }: { id: string }): Promise<OrderDetail> {
  return apiRead<OrderDetail>(`/admin/orders/${encodeURIComponent(id)}/`);
}

export async function transitionOrder({
  id,
  to,
}: {
  id: string;
  to: Exclude<OrderStatus, "pending">;
}): Promise<OrderDetail> {
  return apiWrite<OrderDetail>(`/admin/orders/${encodeURIComponent(id)}/transition/`, {
    method: "POST",
    body: { to },
  });
}
