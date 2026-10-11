import { Link } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderStatusBadge, type OrderStatus } from "@/features/orders";

import type { Dashboard } from "../schemas/dashboard.schema";

const STATUSES: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export function StatusSummary({ counts }: { counts: Dashboard["orders_by_status"] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by status</CardTitle>
        <CardDescription>All time. Select one to open the queue.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {STATUSES.map((status) => (
          <Link
            key={status}
            to="/orders"
            search={{ status: [status] }}
            className="inline-flex items-center gap-2 rounded-md border px-2 py-1 hover:bg-muted"
          >
            <OrderStatusBadge status={status} />{" "}
            <span className="font-semibold tabular-nums">{counts[status]}</span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
