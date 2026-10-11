import { createFileRoute, notFound } from "@tanstack/react-router";

import { OrderDetail, orderQueries } from "@/features/orders";
import { ApiError } from "@/lib/repositories/errors";

export const Route = createFileRoute("/_dashboard/orders/$orderId")({
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData(orderQueries.detail(params.orderId));
    } catch (error) {
      if (error instanceof ApiError && error.code === "not_found") throw notFound();
      throw error;
    }
  },
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  return <OrderDetail orderId={orderId} />;
}
