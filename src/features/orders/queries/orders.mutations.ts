import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { dashboardKeys } from "@/features/dashboard";
import { productKeys, stockKeys } from "@/features/products";
import { describeError } from "@/lib/repositories/errors";

import { ORDER_STATUS } from "../order-status";
import { transitionOrder } from "../repositories/orders.repository";
import type { OrderStatus } from "../schemas/order-status.schema";
import { orderKeys } from "./orders.queries";

export function useTransitionOrder(id: string, orderNumber: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (to: OrderStatus) => transitionOrder(id, to),
    // A cancel puts stock back and records it in each variant's stock history.
    meta: {
      invalidates: [orderKeys.lists(), dashboardKeys.all, productKeys.all, stockKeys.all],
    },
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
