"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { SalesDay } from "@/lib/api/types";
import { formatDay } from "@/lib/format/date";
import { formatMoney, toChartNumber } from "@/lib/format/money";

const CONFIG = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

const COMPACT = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });

export type SalesPoint = {
  day: string;
  revenue: number;
  revenueLabel: string;
  orders: number;
};

export function toSalesPoints(days: SalesDay[]): SalesPoint[] {
  return days.map((day) => ({
    day: formatDay(day.date),
    revenue: toChartNumber(day.revenue),
    revenueLabel: formatMoney(day.revenue),
    orders: day.orders,
  }));
}

export function SalesChart({ days }: { days: SalesDay[] }) {
  const points = toSalesPoints(days);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales, last 30 days</CardTitle>
        <CardDescription>Revenue by order date, excluding cancelled orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={CONFIG} className="aspect-auto h-64 w-full">
          <AreaChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="fill-revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value: number) => COMPACT.format(value)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(_value, _name, item) => {
                    const point: SalesPoint = item.payload;
                    return (
                      <div className="grid w-full gap-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Revenue</span>
                          <span className="font-medium">{point.revenueLabel}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-muted-foreground">Orders</span>
                          <span className="font-medium">{point.orders}</span>
                        </div>
                      </div>
                    );
                  }}
                />
              }
            />
            <Area
              dataKey="revenue"
              type="monotone"
              fill="url(#fill-revenue)"
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
