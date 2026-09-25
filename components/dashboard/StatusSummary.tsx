import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ORDER_STATUSES, type Dashboard } from "@/lib/api/types";
import { ordersHref } from "@/lib/orders/query";
import { ORDER_STATUS } from "@/lib/orders/status";

export function StatusSummary({ counts }: { counts: Dashboard["orders_by_status"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by status</CardTitle>
        <CardDescription>All time. Select one to open the queue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {ORDER_STATUSES.map((status) => (
          <Badge key={status} asChild variant={ORDER_STATUS[status].badge} className="h-7 px-3">
            <Link href={ordersHref({ status: [status] })}>
              {ORDER_STATUS[status].label}
              <span className="font-semibold tabular-nums">{counts[status]}</span>
            </Link>
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}
