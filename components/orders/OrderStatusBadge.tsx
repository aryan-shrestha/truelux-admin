import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/api/types";
import { ORDER_STATUS } from "@/lib/orders/status";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { label, badge } = ORDER_STATUS[status];
  return <Badge variant={badge}>{label}</Badge>;
}
