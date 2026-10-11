import type { OrderStatus } from "./schemas/order-status.schema";

type StatusBadgeVariant = "warning" | "info" | "secondary" | "success" | "destructive";

export const ORDER_STATUS: Record<OrderStatus, { label: string; badge: StatusBadgeVariant }> = {
  pending: { label: "Pending", badge: "warning" },
  confirmed: { label: "Confirmed", badge: "info" },
  shipped: { label: "Shipped", badge: "secondary" },
  delivered: { label: "Delivered", badge: "success" },
  cancelled: { label: "Cancelled", badge: "destructive" },
};

export type TransitionTarget = Exclude<OrderStatus, "pending">;

export const TRANSITION_LABEL: Record<TransitionTarget, string> = {
  confirmed: "Confirm order",
  shipped: "Mark as shipped",
  delivered: "Mark as delivered",
  cancelled: "Cancel order",
};
