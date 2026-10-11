import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { InboxIcon } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { formatDateTime } from "@/lib/date";
import { formatMoney } from "@/lib/money";

import type { OrderListItem } from "../schemas/order.schema";
import { OrderStatusBadge } from "./order-status-badge";

const COLUMNS: ColumnDef<OrderListItem>[] = [
  {
    accessorKey: "order_number",
    header: "Order",
    cell: ({ row }) => (
      <Link
        to="/orders/$orderId"
        params={{ orderId: row.original.id }}
        className="font-mono font-medium hover:underline"
      >
        {row.original.order_number}
      </Link>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Placed",
    cell: ({ row }) => formatDateTime(row.original.created_at),
  },
  { accessorKey: "full_name", header: "Customer" },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.phone}</span>,
  },
  {
    accessorKey: "item_count",
    header: () => <div className="text-right">Units</div>,
    cell: ({ row }) => <div className="text-right">{row.original.item_count}</div>,
  },
  {
    accessorKey: "total",
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => <div className="text-right">{formatMoney(row.original.total)}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },
];

export function OrdersTable({
  orders,
  count,
  pageIndex,
  pageSize,
  isFiltered,
  isLoading,
  isPlaceholderData,
}: {
  orders: OrderListItem[];
  count: number;
  pageIndex: number;
  pageSize: number;
  isFiltered: boolean;
  isLoading: boolean;
  isPlaceholderData: boolean;
}) {
  return (
    <DataTable
      columns={COLUMNS}
      data={orders}
      rowCount={count}
      pagination={{ pageIndex, pageSize }}
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      empty={
        <EmptyState
          icon={InboxIcon}
          title={isFiltered ? "No orders match these filters" : "No orders yet"}
          description={
            isFiltered
              ? "Pick another status or widen the dates."
              : "Orders placed on the storefront appear here."
          }
        />
      }
    />
  );
}
