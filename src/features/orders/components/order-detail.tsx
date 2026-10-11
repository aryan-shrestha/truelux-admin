import { useSuspenseQuery } from "@tanstack/react-query";

import { PageHeader } from "@/components/layout/page-header";

import { orderQueries } from "../queries/orders.queries";
import { CustomerCard } from "./customer-card";
import { OrderActions } from "./order-actions";
import { OrderItemsCard } from "./order-items-card";
import { OrderStatusBadge } from "./order-status-badge";

export function OrderDetail({ orderId }: { orderId: string }) {
  const { data: order } = useSuspenseQuery(orderQueries.detail(orderId));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[
          { label: "Shop" },
          { label: "Orders", to: "/orders" },
          { label: order.order_number },
        ]}
        title={order.order_number}
        actions={<OrderActions order={order} />}
      />
      <div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
          <OrderItemsCard order={order} />
        </div>
        <CustomerCard order={order} />
      </div>
    </div>
  );
}
