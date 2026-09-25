"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { InboxIcon } from "lucide-react";
import Link from "next/link";

import { DataTable } from "@/components/data-table/DataTable";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { TableEmpty } from "@/components/data-table/TableEmpty";
import type { OrderListItem } from "@/lib/api/types";
import { formatDateTime } from "@/lib/format/date";
import { formatMoney } from "@/lib/format/money";

const COLUMNS: ColumnDef<OrderListItem>[] = [
  {
    accessorKey: "order_number",
    header: "Order",
    cell: ({ row }) => (
      <Link href={`/orders/${row.original.id}`} className="font-mono font-medium hover:underline">
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
  { accessorKey: "item_count", header: "Items", meta: { className: "text-right" } },
  {
    accessorKey: "total",
    header: "Total",
    meta: { className: "text-right" },
    cell: ({ row }) => formatMoney(row.original.total),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  },
];

export function OrdersTable({ orders, filtered }: { orders: OrderListItem[]; filtered: boolean }) {
  return (
    <DataTable
      columns={COLUMNS}
      data={orders}
      getRowId={(order) => order.id}
      empty={
        <TableEmpty
          icon={InboxIcon}
          title={filtered ? "No orders match these filters" : "No orders yet"}
          description={
            filtered
              ? "Pick another status or widen the dates."
              : "Orders placed on the storefront appear here."
          }
        />
      }
    />
  );
}
