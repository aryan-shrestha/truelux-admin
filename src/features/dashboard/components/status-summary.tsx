import { Link } from "@tanstack/react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { OrderStatusBadge, type OrderStatus } from "@/features/orders";

import type { Dashboard } from "../schemas/dashboard.schema";

// Lifecycle order, not by size, so each status keeps its place as the counts change.
const STATUSES: readonly OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

// A horizontal bar per status, scaled to the largest count. The badge names the row,
// so every bar wears the one chart colour; each row is a link to that status's queue.
export function StatusSummary({ counts }: { counts: Dashboard["orders_by_status"] }) {
  const largest = Math.max(...STATUSES.map((status) => counts[status]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by status</CardTitle>
        <CardDescription>All time. Select a status to open its queue.</CardDescription>
      </CardHeader>
      {/* Beside the sales chart the card is as tall as it; the rows spread to fill it. */}
      <CardContent className="flex-1">
        <ul className="flex h-full flex-col justify-between gap-1">
          {STATUSES.map((status) => (
            <li key={status}>
              <Link
                to="/orders"
                search={{ status: [status] }}
                className="grid grid-cols-[6rem_1fr_3rem] items-center gap-3 rounded-md px-2 py-2 hover:bg-muted"
              >
                <span>
                  <OrderStatusBadge status={status} />
                </span>{" "}
                <span aria-hidden className="h-3">
                  <span
                    className={cn(
                      "block h-full rounded-r-[4px] bg-chart-1",
                      counts[status] > 0 && "min-w-1",
                    )}
                    style={{ width: largest === 0 ? 0 : `${(counts[status] / largest) * 100}%` }}
                  />
                </span>
                <span className="text-right font-semibold tabular-nums">{counts[status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
