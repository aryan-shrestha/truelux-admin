import type { OrderStatus } from "@/lib/api/types";

type BadgeVariant = "warning" | "info" | "secondary" | "success" | "destructive";

export const ORDER_STATUS: Record<OrderStatus, { label: string; badge: BadgeVariant }> = {
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

export const AWAITING_ACTION: OrderStatus[] = ["pending", "confirmed"];
