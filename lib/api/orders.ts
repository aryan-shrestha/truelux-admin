import "server-only";

import { type Reader, apiRead, apiWrite } from "@/lib/api/client";
import type { OrderDetail, OrderListItem, OrderQuery, OrderStatus, Page } from "@/lib/api/types";

export async function listOrders(
  query: OrderQuery,
  read: Reader = apiRead,
): Promise<Page<OrderListItem>> {
  return read<Page<OrderListItem>>("/admin/orders/", query);
}

export async function getOrder(
  { id }: { id: string },
  read: Reader = apiRead,
): Promise<OrderDetail> {
  return read<OrderDetail>(`/admin/orders/${encodeURIComponent(id)}/`);
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
