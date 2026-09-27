"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { CustomerCard } from "@/components/orders/CustomerCard";
import { OrderActions } from "@/components/orders/OrderActions";
import { OrderItemsCard } from "@/components/orders/OrderItemsCard";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { PageHeader } from "@/components/shell/PageHeader";
import { orderQueries } from "@/lib/orders/queries";

export function OrderView({ id }: { id: string }) {
  const { data: order } = useSuspenseQuery(orderQueries.detail(id));

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Shop" },
          { label: "Orders", href: "/orders" },
          { label: order.order_number },
        ]}
        title={order.order_number}
        description={<OrderStatusBadge status={order.status} />}
      >
        <OrderActions
          orderId={order.id}
          orderNumber={order.order_number}
          allowed={order.allowed_transitions}
        />
      </PageHeader>
      <div className="grid grid-cols-1 gap-4 p-4 md:p-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OrderItemsCard order={order} />
        </div>
        <CustomerCard order={order} />
      </div>
    </>
  );
}
