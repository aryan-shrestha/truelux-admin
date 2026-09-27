import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";

import { OrdersView } from "@/components/orders/OrdersView";
import { PageHeader } from "@/components/shell/PageHeader";
import { listOrders } from "@/lib/api/orders";
import { orderQueries } from "@/lib/orders/queries";
import { parseOrderFilters, toOrderQuery } from "@/lib/orders/query";
import { getServerQueryClient } from "@/lib/query/server";

export const metadata: Metadata = { title: "Orders" };

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const filters = parseOrderFilters(await searchParams);
  const queryClient = getServerQueryClient();
  await queryClient.fetchQuery({
    ...orderQueries.list(filters),
    queryFn: () => listOrders(toOrderQuery(filters)),
  });

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Shop" }, { label: "Orders" }]}
        title="Orders"
        description="Cash on delivery: confirm by phone, ship, then mark delivered once paid."
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <OrdersView />
      </HydrationBoundary>
    </>
  );
}
