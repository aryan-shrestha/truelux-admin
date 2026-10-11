import { Link } from "@tanstack/react-router";
import { InboxIcon } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge, type OrderListItem } from "@/features/orders";
import { formatDateTime } from "@/lib/date";
import { formatMoney } from "@/lib/money";

export function RecentOrders({ orders }: { orders: readonly OrderListItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link to="/orders">All orders</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title="No orders yet"
            description="New orders from the storefront appear here."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      to="/orders/$orderId"
                      params={{ orderId: order.id }}
                      className="font-mono font-medium hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>{order.full_name}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(order.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
