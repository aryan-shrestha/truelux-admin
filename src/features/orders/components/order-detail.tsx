import { useSuspenseQuery } from "@tanstack/react-query";

import { Page } from "@/components/layout/page";
import { PageHeader } from "@/components/layout/page-header";

import { orderQueries } from "../queries/orders.queries";
import { CustomerCard } from "./customer-card";
import { OrderActions } from "./order-actions";
import { OrderItemsCard } from "./order-items-card";
import { OrderStatusBadge } from "./order-status-badge";

export function OrderDetail({ orderId }: { orderId: string }) {
  const { data: order } = useSuspenseQuery(orderQueries.detail(orderId));

  return (
    <Page>
      <PageHeader
        crumbs={[
          { label: "Shop" },
          { label: "Orders", to: "/orders" },
          { label: order.order_number },
        ]}
        title={order.order_number}
        actions={<OrderActions order={order} />}
      />
      {/* Below the header, the order's content is what scrolls. */}
      <div className="relative flex flex-col gap-6 md:min-h-0 md:overflow-y-auto">
        <div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="min-w-0 xl:col-span-2">
            <OrderItemsCard order={order} />
          </div>
          <CustomerCard order={order} />
        </div>
      </div>
    </Page>
  );
}
