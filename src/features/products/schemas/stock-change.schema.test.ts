import { STOCK_CHANGE_SCHEMA, toStockChange } from "./stock-change.schema";

describe("stock changes", () => {
  it.each([
    ["received", "received", 3],
    ["returned", "returned", 3],
    ["damaged", "damaged", -3],
    ["expired", "expired", -3],
    ["tester", "tester", -3],
    ["correction_add", "correction", 3],
    ["correction_remove", "correction", -3],
  ] as const)("records %s as the reason %s with change %i", (kind, reason, quantity_change) => {
    const values = STOCK_CHANGE_SCHEMA.parse({ kind, quantity: "3", note: " Box 12 " });

    expect(toStockChange(values)).toEqual({
      kind: "adjustment",
      body: { reason, quantity_change, note: "Box 12" },
    });
  });

  it("sends a count as the absolute stock, which may be 0", () => {
    const values = STOCK_CHANGE_SCHEMA.parse({ kind: "count", quantity: "0", note: "" });

    expect(toStockChange(values)).toEqual({ kind: "count", body: { stock_quantity: 0 } });
  });

  it("refuses 0 for an adjustment", () => {
    const result = STOCK_CHANGE_SCHEMA.safeParse({ kind: "received", quantity: "0", note: "" });

    expect(result.success).toBe(false);
  });

  it.each(["abc", "1.5", "-2"])("refuses the quantity %s", (quantity) => {
    expect(STOCK_CHANGE_SCHEMA.safeParse({ kind: "received", quantity, note: "" }).success).toBe(
      false,
    );
  });

  it.each(["sale", "cancellation", "stocktake"])(
    "refuses %s, which only orders and counts record",
    (kind) => {
      expect(STOCK_CHANGE_SCHEMA.safeParse({ kind, quantity: "1", note: "" }).success).toBe(false);
    },
  );
});
