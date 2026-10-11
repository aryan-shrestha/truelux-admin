import { z } from "zod";

// back-end/docs/features/admin-api.md: pending → confirmed → shipped → delivered, with
// cancelled reachable from pending and confirmed.
export const ORDER_STATUS_SCHEMA = z.enum([
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export type OrderStatus = z.infer<typeof ORDER_STATUS_SCHEMA>;
