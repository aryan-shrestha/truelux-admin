import { Badge } from "@/components/ui/badge";

import { ORDER_STATUS } from "../order-status";
import type { OrderStatus } from "../schemas/order-status.schema";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, badge } = ORDER_STATUS[status];
  return <Badge variant={badge}>{label}</Badge>;
}
