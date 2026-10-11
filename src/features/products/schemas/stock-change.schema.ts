import { z } from "zod";

// What staff choose in the dialog. Each adjustment fixes the API's reason and the sign,
// so the quantity typed is always positive; the API refuses a sign that contradicts
// the reason. A count sets the absolute total instead (recorded as a stocktake).
const ADJUSTMENTS = {
  received: { label: "Received from a supplier (adds)", reason: "received", sign: 1 },
  returned: { label: "Returned by a customer (adds)", reason: "returned", sign: 1 },
  damaged: { label: "Damaged (removes)", reason: "damaged", sign: -1 },
  expired: { label: "Expired (removes)", reason: "expired", sign: -1 },
  tester: { label: "Used as a tester or sample (removes)", reason: "tester", sign: -1 },
  correction_add: { label: "Correction (adds)", reason: "correction", sign: 1 },
  correction_remove: { label: "Correction (removes)", reason: "correction", sign: -1 },
} as const;

type AdjustmentKind = keyof typeof ADJUSTMENTS;

const KINDS = [...(Object.keys(ADJUSTMENTS) as AdjustmentKind[]), "count"] as const;

export const STOCK_CHANGE_OPTIONS = [
  ...(Object.keys(ADJUSTMENTS) as AdjustmentKind[]).map((kind) => ({
    value: kind,
    label: ADJUSTMENTS[kind].label,
  })),
  { value: "count", label: "Counted the shelf (sets the total)" },
] as const;

export const STOCK_CHANGE_SCHEMA = z
  .object({
    kind: z.enum(KINDS, "Choose what happened."),
    quantity: z.coerce
      .number<string | number>("Enter a whole number.")
      .int("Enter a whole number.")
      .min(0, "Cannot be negative."),
    note: z.string().trim().max(500, "Use at most 500 characters."),
  })
  .refine((values) => values.kind === "count" || values.quantity > 0, {
    path: ["quantity"],
    message: "Enter at least 1.",
  });

export type StockChangeValues = z.infer<typeof STOCK_CHANGE_SCHEMA>;

export type StockChange =
  | { kind: "count"; body: { stock_quantity: number } }
  | {
      kind: "adjustment";
      body: {
        reason: (typeof ADJUSTMENTS)[AdjustmentKind]["reason"];
        quantity_change: number;
        note: string;
      };
    };

// The one place a sign is applied.
export function toStockChange({ kind, quantity, note }: StockChangeValues): StockChange {
  if (kind === "count") return { kind: "count", body: { stock_quantity: quantity } };
  const { reason, sign } = ADJUSTMENTS[kind];
  return { kind: "adjustment", body: { reason, quantity_change: sign * quantity, note } };
}
