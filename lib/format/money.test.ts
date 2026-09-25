import { describe, expect, it } from "vitest";

import { MONEY_PATTERN, formatMoney, toChartNumber } from "@/lib/format/money";

describe("formatMoney", () => {
  it("groups rupees the Indian way and keeps two places", () => {
    expect(formatMoney("190350.00")).toBe("Rs 1,90,350.00");
    expect(formatMoney("5400.5")).toBe("Rs 5,400.50");
    expect(formatMoney("0.00")).toBe("Rs 0.00");
  });

  it("keeps digits exact beyond float precision", () => {
    expect(formatMoney("12345678901234567.89")).toBe("Rs 12,34,56,78,90,12,34,567.89");
  });

  it("returns a malformed amount verbatim instead of NaN", () => {
    expect(formatMoney("abc")).toBe("abc");
  });
});

describe("toChartNumber", () => {
  it("converts a decimal string for chart geometry", () => {
    expect(toChartNumber("9600.00")).toBe(9600);
    expect(toChartNumber("12.5")).toBe(12.5);
  });

  it("plots a malformed amount as zero", () => {
    expect(toChartNumber("")).toBe(0);
  });
});

describe("MONEY_PATTERN", () => {
  it.each(["0", "3200", "3200.5", "3200.00"])("accepts %s", (value) => {
    expect(MONEY_PATTERN.test(value)).toBe(true);
  });

  it.each(["-1", "3200.001", "1e3", " 12", "12,00", ""])("rejects %s", (value) => {
    expect(MONEY_PATTERN.test(value)).toBe(false);
  });
});
