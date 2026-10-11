import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { dashboardKeys } from "@/features/dashboard";
import { productKeys } from "@/features/products";
import { describeError } from "@/lib/repositories/errors";

import { ORDER_STATUS } from "../order-status";
import { transitionOrder } from "../repositories/orders.repository";
import type { OrderStatus } from "../schemas/order-status.schema";
import { orderKeys } from "./orders.queries";

export function useTransitionOrder(id: string, orderNumber: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (to: OrderStatus) => transitionOrder(id, to),
    // A cancel puts stock back, so products go stale too. Stock history joins this
    // list with the stock-ledger feature (tanstack-query.md#rules-for-features).
    meta: { invalidates: [orderKeys.lists(), dashboardKeys.all, productKeys.all] },
    onSuccess: (order, to) => {
      queryClient.setQueryData(orderKeys.detail(id), order);
      toast.success(`${orderNumber} is now ${ORDER_STATUS[to].label.toLowerCase()}`);
    },
    // The API owns the state machine: a refused move means this page is stale.
    onError: (error) => {
      toast.error(describeError(error));
      return queryClient.invalidateQueries({ queryKey: orderKeys.detail(id) });
    },
  });
}
