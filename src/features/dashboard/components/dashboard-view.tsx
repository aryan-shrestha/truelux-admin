import { useSuspenseQuery } from "@tanstack/react-query";

import { dashboardQueries } from "../queries/dashboard.queries";
import { KpiCards } from "./kpi-cards";
import { LowStockTable } from "./low-stock-table";
import { RecentOrders } from "./recent-orders";
import { SalesChart } from "./sales-chart";
import { StatusSummary } from "./status-summary";

export function DashboardView() {
  const { data: dashboard } = useSuspenseQuery(dashboardQueries.dashboard());

  return (
    <div className="flex flex-col gap-4">
      <KpiCards revenue={dashboard.revenue} ordersByStatus={dashboard.orders_by_status} />
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="min-w-0 xl:col-span-2">
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
