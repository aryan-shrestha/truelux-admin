import { InboxIcon } from "lucide-react";
import Link from "next/link";

import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TableEmpty } from "@/components/data-table/TableEmpty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrderListItem } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";

export function RecentOrders({ orders }: { orders: OrderListItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent orders</CardTitle>
        <CardAction>
          <Button asChild variant="outline" size="sm">
            <Link href="/orders">All orders</Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <TableEmpty
            icon={InboxIcon}
            title={"No orders yet"}
            description={"New orders from the storefront appear here."}
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
                      href={`/orders/${order.id}`}
                      className="font-mono font-medium hover:underline"
                    >
                      {order.order_number}
                    </Link>
                    <div className="text-muted-foreground text-xs">
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
