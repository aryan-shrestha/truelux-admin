import { z } from "zod";

export const STOCK_REASON_SCHEMA = z.enum([
  "stocktake",
  "sale",
  "cancellation",
  "received",
  "returned",
  "damaged",
  "expired",
  "tester",
  "correction",
]);

export const STOCK_MOVEMENT_SCHEMA = z.object({
  id: z.uuid(),
  // null once the variant has been deleted; `sku` still names it.
  variant_id: z.uuid().nullable(),
  sku: z.string(),
  reason: STOCK_REASON_SCHEMA,
  quantity_change: z.number().int(),
  balance_after: z.number().int(),
  order_id: z.uuid().nullable(),
  order_number: z.string().nullable(),
  actor_email: z.string().nullable(),
  note: z.string(),
  created_at: z.iso.datetime({ offset: true }),
});

export type StockMovement = z.infer<typeof STOCK_MOVEMENT_SCHEMA>;

export const STOCK_REASON_LABEL: Record<z.infer<typeof STOCK_REASON_SCHEMA>, string> = {
  stocktake: "Count",
  sale: "Sale",
  cancellation: "Order cancelled",
  received: "Received",
  returned: "Returned",
  damaged: "Damaged",
  expired: "Expired",
  tester: "Tester or sample",
  correction: "Correction",
};
