"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { ConfirmAction } from "@/components/form/ConfirmAction";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { ActionFailure } from "@/lib/actions/attempt";
import type { OrderStatus } from "@/lib/api/types";
import { moveOrder } from "@/lib/orders/actions";
import { ORDER_STATUS, TRANSITION_LABEL, type TransitionTarget } from "@/lib/orders/status";

function isTarget(status: OrderStatus): status is TransitionTarget {
  return status !== "pending";
}

function reportFailure(failure: ActionFailure) {
  toast.error(failure.message);
}

type OrderActionsProps = {
  orderId: string;
  orderNumber: string;
  allowed: OrderStatus[];
};

export function OrderActions({ orderId, orderNumber, allowed }: OrderActionsProps) {
  const [pending, startTransition] = useTransition();
  const targets = allowed.filter(isTarget);
  const forward = targets.filter((target) => target !== "cancelled");

  if (targets.length === 0) {
    return null;
  }

  function move(to: TransitionTarget) {
    startTransition(async () => {
      const result = await moveOrder(orderId, to);
      if (result.ok) toast.success(`${orderNumber} is now ${ORDER_STATUS[to].label.toLowerCase()}`);
      else reportFailure(result);
    });
  }

  return (
    <>
      {targets.includes("cancelled") ? (
        <ConfirmAction
          trigger={
            <Button variant="outline" disabled={pending}>
              {TRANSITION_LABEL.cancelled}
            </Button>
          }
          title={`Cancel ${orderNumber}?`}
          description="The items go back into stock. A cancelled order cannot be reopened."
          confirmLabel="Cancel order"
          successMessage={`${orderNumber} cancelled`}
          action={() => moveOrder(orderId, "cancelled")}
          onFailure={reportFailure}
        />
      ) : null}
      {forward.map((target) => (
        <Button key={target} disabled={pending} onClick={() => move(target)}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          {TRANSITION_LABEL[target]}
        </Button>
      ))}
    </>
  );
}
