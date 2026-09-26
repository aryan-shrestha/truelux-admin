import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { Dashboard } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";
import { daysAgo } from "@/lib/format/date";
import { ordersHref } from "@/lib/orders/query";
import { AWAITING_ACTION } from "@/lib/orders/status";

type KpiCardsProps = {
  revenue: Dashboard["revenue"];
  ordersByStatus: Dashboard["orders_by_status"];
};

export function KpiCards({ revenue, ordersByStatus }: KpiCardsProps) {
  const today = daysAgo(0);
  const awaiting = AWAITING_ACTION.reduce((sum, status) => sum + ordersByStatus[status], 0);
  const cards = [
    {
      label: "Revenue today",
      value: formatMoney(revenue.today),
      href: ordersHref({ from: today, to: today }),
      link: "Today's orders",
    },
    {
      label: "Last 7 days",
      value: formatMoney(revenue.last_7_days),
      href: ordersHref({ from: daysAgo(6), to: today }),
      link: "This week's orders",
    },
    {
      label: "Last 30 days",
      value: formatMoney(revenue.last_30_days),
      href: ordersHref({ from: daysAgo(29), to: today }),
      link: "This month's orders",
    },
    {
      label: "Awaiting action",
      value: String(awaiting),
      href: ordersHref({ status: AWAITING_ACTION }),
      link: "Pending and confirmed",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardHeader>
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="font-sans text-2xl tabular-nums">{card.value}</CardTitle>
          </CardHeader>
          <CardFooter className="border-t">
            <Button asChild variant="link" size="xs" className="px-0">
              <Link href={card.href}>{card.link}</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
