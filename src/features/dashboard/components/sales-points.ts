import { parseIsoDate } from "@/lib/date";
import { formatMoney, toChartNumber } from "@/lib/money";

import type { SalesDay } from "../schemas/dashboard.schema";

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });

export interface SalesPoint {
  day: string;
  revenue: number;
  revenueLabel: string;
  orders: number;
}

// `revenue` is chart geometry only; the tooltip shows `revenueLabel`, the API's string.
export function toSalesPoints(days: readonly SalesDay[]): SalesPoint[] {
  return days.map((day) => ({
    day: DAY.format(parseIsoDate(day.date)),
    revenue: toChartNumber(day.revenue),
    revenueLabel: formatMoney(day.revenue),
    orders: day.orders,
  }));
}
