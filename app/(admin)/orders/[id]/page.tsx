import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OrderView } from "@/components/orders/OrderView";
import { hasCode } from "@/lib/api/errors";
import { getOrder } from "@/lib/api/orders";
import type { OrderDetail } from "@/lib/api/types";
import { orderQueries } from "@/lib/orders/queries";
import { getServerQueryClient } from "@/lib/query/server";

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
  const { id } = await params;
  const queryClient = getServerQueryClient();
  queryClient.setQueryData(orderQueries.detail(id).queryKey, await findOrder(id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrderView id={id} />
    </HydrationBoundary>
  );
}
