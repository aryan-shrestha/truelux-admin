import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderFilters } from "@/features/orders";
import { shopDaysAgo } from "@/lib/date";
import { formatMoney } from "@/lib/money";

import type { Dashboard } from "../schemas/dashboard.schema";

interface Kpi {
  label: string;
  value: string;
  link: string;
  search: OrderFilters;
}

export function KpiCards({
  revenue,
  ordersByStatus,
}: {
  revenue: Dashboard["revenue"];
  ordersByStatus: Dashboard["orders_by_status"];
}) {
  const today = shopDaysAgo(0);
  // A count of orders, not money: the sum of two of the API's counts.
  const awaitingAction = ordersByStatus.pending + ordersByStatus.confirmed;
  const kpis: Kpi[] = [
    {
      label: "Revenue today",
      value: formatMoney(revenue.today),
      link: "Today's orders",
      search: { from: today, to: today },
    },
    {
      label: "Last 7 days",
      value: formatMoney(revenue.last_7_days),
      link: "This week's orders",
      search: { from: shopDaysAgo(6), to: today },
    },
    {
      label: "Last 30 days",
      value: formatMoney(revenue.last_30_days),
      link: "This month's orders",
      search: { from: shopDaysAgo(29), to: today },
    },
    {
      label: "Awaiting action",
      value: String(awaitingAction),
      link: "Pending and confirmed",
      search: { status: ["pending", "confirmed"] },
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardHeader>
            <CardDescription>{kpi.label}</CardDescription>
            <CardTitle className="font-sans text-2xl tabular-nums">{kpi.value}</CardTitle>
          </CardHeader>
          <CardFooter className="border-t">
            <Button asChild variant="link" size="sm" className="px-0">
              <Link to="/orders" search={kpi.search}>
                {kpi.link}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
