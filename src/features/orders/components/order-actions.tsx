import { useState } from "react";

import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { TRANSITION_LABEL, type TransitionTarget } from "../order-status";
import { useTransitionOrder } from "../queries/orders.mutations";
import type { OrderStatus } from "../schemas/order-status.schema";
import type { Order } from "../schemas/order.schema";

function isTransitionTarget(status: OrderStatus): status is TransitionTarget {
  return status !== "pending";
}

// Only what the API lists in allowed_transitions is offered; the flow is the API's.
export function OrderActions({ order }: { order: Order }) {
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const transition = useTransitionOrder(order.id, order.order_number);
  const targets = order.allowed_transitions.filter(isTransitionTarget);
  const forwardTargets = targets.filter((target) => target !== "cancelled");

  if (targets.length === 0) return null;

  return (
    <>
      {targets.includes("cancelled") && (
        <ConfirmDialog
          trigger={
            <Button variant="outline" disabled={transition.isPending}>
              {TRANSITION_LABEL.cancelled}
            </Button>
          }
          title={`Cancel ${order.order_number}?`}
          description="The items go back into stock. A cancelled order cannot be reopened."
          confirmLabel={TRANSITION_LABEL.cancelled}
          isPending={transition.isPending}
          open={isCancelOpen}
          onOpenChange={setIsCancelOpen}
          onConfirm={() =>
            transition.mutate("cancelled", { onSuccess: () => setIsCancelOpen(false) })
          }
        />
      )}
      {forwardTargets.map((target) => (
        <Button
          key={target}
          disabled={transition.isPending}
          onClick={() => transition.mutate(target)}
        >
          {transition.isPending && transition.variables === target && (
            <Spinner aria-hidden data-icon="inline-start" />
          )}
          {TRANSITION_LABEL[target]}
        </Button>
      ))}
    </>
  );
}
