import type { Money } from "@/lib/api/types";

export const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;

export function isPositiveAmount(amount: string): boolean {
  return MONEY_PATTERN.test(amount) && /[1-9]/.test(amount);
}

const GROUPER = new Intl.NumberFormat("en-IN");

function split(amount: Money): { rupees: string; paisa: string } | null {
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(amount.trim());
  if (!match) {
    return null;
  }
  const [, sign = "", whole = "0", fraction = ""] = match;
  return { rupees: `${sign}${whole}`, paisa: fraction.padEnd(2, "0") };
}

export function formatMoney(amount: Money): string {
  const parts = split(amount);
  if (!parts) {
    return amount;
  }
  // BigInt keeps grouping exact for any length; the amount is never a float.
  return `Rs ${GROUPER.format(BigInt(parts.rupees))}.${parts.paisa}`;
}

// The single sanctioned parse to a number, for chart geometry only. Totals are never
// computed from its result.
export function toChartNumber(amount: Money): number {
  const parts = split(amount);
  return parts ? Number(`${parts.rupees}.${parts.paisa}`) : 0;
}
