"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmAction } from "@/components/form/ConfirmAction";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { OrderDetail, OrderStatus } from "@/lib/api/types";
import { dashboardKeys } from "@/lib/dashboard/queries";
import { moveOrder } from "@/lib/orders/actions";
import { orderKeys, orderQueries } from "@/lib/orders/queries";
import { ORDER_STATUS, TRANSITION_LABEL, type TransitionTarget } from "@/lib/orders/status";
import { failureMessage, throwOnFailure } from "@/lib/query/action";

function isTarget(status: OrderStatus): status is TransitionTarget {
  return status !== "pending";
}

const INVALIDATES = [orderKeys.lists(), dashboardKeys.all];

type OrderActionsProps = {
  orderId: string;
  orderNumber: string;
  allowed: OrderStatus[];
};

export function OrderActions({ orderId, orderNumber, allowed }: OrderActionsProps) {
  const queryClient = useQueryClient();
  const targets = allowed.filter(isTarget);
  const forward = targets.filter((target) => target !== "cancelled");

  function showOrder(order: OrderDetail) {
    queryClient.setQueryData(orderQueries.detail(orderId).queryKey, order);
  }

  const { mutate, isPending } = useMutation({
    mutationFn: async (to: TransitionTarget) => throwOnFailure(await moveOrder(orderId, to)),
    meta: { invalidates: INVALIDATES },
    onSuccess: (order, to) => {
      showOrder(order);
      toast.success(`${orderNumber} is now ${ORDER_STATUS[to].label.toLowerCase()}`);
    },
    onError: (error) => {
      const message = failureMessage(error);
      if (message) toast.error(message);
    },
  });

  if (targets.length === 0) {
    return null;
  }

  return (
    <>
      {targets.includes("cancelled") ? (
        <ConfirmAction
          trigger={
            <Button variant="outline" disabled={isPending}>
              {TRANSITION_LABEL.cancelled}
            </Button>
          }
          title={`Cancel ${orderNumber}?`}
          description="The items go back into stock. A cancelled order cannot be reopened."
          confirmLabel="Cancel order"
          successMessage={`${orderNumber} cancelled`}
          action={() => moveOrder(orderId, "cancelled")}
          invalidates={INVALIDATES}
          onSuccess={showOrder}
        />
      ) : null}
      {forward.map((target) => (
        <Button key={target} disabled={isPending} onClick={() => mutate(target)}>
          {isPending ? <Spinner data-icon="inline-start" /> : null}
          {TRANSITION_LABEL[target]}
        </Button>
      ))}
    </>
  );
}
