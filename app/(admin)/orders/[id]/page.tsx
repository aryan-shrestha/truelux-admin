import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CustomerCard } from "@/components/orders/CustomerCard";
import { OrderActions } from "@/components/orders/OrderActions";
import { OrderItemsCard } from "@/components/orders/OrderItemsCard";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { PageHeader } from "@/components/shell/PageHeader";
import { hasCode } from "@/lib/api/errors";
import { getOrder } from "@/lib/api/orders";
import type { OrderDetail } from "@/lib/api/types";

export const metadata: Metadata = { title: "Order" };

async function findOrder(id: string): Promise<OrderDetail> {
  try {
    return await getOrder({ id });
  } catch (error) {
    if (hasCode(error, "not_found")) notFound();
    throw error;
  }
}

export default async function OrderPage({ params }: PageProps<"/orders/[id]">) {
  const order = await findOrder((await params).id);

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Shop" }, { label: "Orders", href: "/orders" }, { label: order.order_number }]}
        title={order.order_number}
        description={<OrderStatusBadge status={order.status} />}
      >
        <OrderActions orderId={order.id} orderNumber={order.order_number} allowed={order.allowed_transitions} />
      </PageHeader>
      <div className="grid gap-4 p-4 md:p-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OrderItemsCard order={order} />
        </div>
        <CustomerCard order={order} />
      </div>
    </>
  );
}
