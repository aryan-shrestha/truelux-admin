"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { KpiCards } from "@/components/dashboard/KpiCards";
import { LowStockTable } from "@/components/dashboard/LowStockTable";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { StatusSummary } from "@/components/dashboard/StatusSummary";
import { dashboardQuery } from "@/lib/dashboard/queries";

export function DashboardView() {
  const { data: dashboard } = useSuspenseQuery(dashboardQuery);

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <KpiCards revenue={dashboard.revenue} ordersByStatus={dashboard.orders_by_status} />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SalesChart days={dashboard.sales_by_day} />
        </div>
        <StatusSummary counts={dashboard.orders_by_status} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <RecentOrders orders={dashboard.recent_orders} />
        <LowStockTable variants={dashboard.low_stock} />
      </div>
    </div>
  );
}
