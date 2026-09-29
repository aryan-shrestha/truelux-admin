"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { PackageSearchIcon } from "lucide-react";
import Link from "next/link";

import { DataTable } from "@/components/data-table/DataTable";
import { ProductRowActions } from "@/components/products/ProductRowActions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableEmpty } from "@/components/data-table/TableEmpty";
import type { ProductListItem } from "@/lib/api/types";
import { formatMoney } from "@/lib/format/money";

const COLUMNS: ColumnDef<ProductListItem>[] = [
  {
    id: "image",
    header: () => <span className="sr-only">Image</span>,
    meta: { className: "w-14" },
    cell: ({ row }) => (
      <Avatar className="size-10 rounded-md">
        {row.original.primary_image_url ? (
          <AvatarImage src={row.original.primary_image_url} alt="" className="object-cover" />
        ) : null}
        <AvatarFallback className="rounded-md">{row.original.name.charAt(0)}</AvatarFallback>
      </Avatar>
    ),
  },
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <span className="flex min-w-0 flex-col">
        <Link
          href={`/products/${row.original.id}`}
          className="truncate font-medium hover:underline"
        >
          {row.original.name}
        </Link>
        <span className="text-muted-foreground truncate font-mono text-xs">
          {row.original.slug}
        </span>
      </span>
    ),
  },
  { id: "brand", header: "Brand", cell: ({ row }) => row.original.brand.name },
  { id: "category", header: "Category", cell: ({ row }) => row.original.category.name },
  {
    accessorKey: "base_price",
    header: "Price",
    meta: { className: "text-right" },
    cell: ({ row }) => formatMoney(row.original.base_price),
  },
  { accessorKey: "variant_count", header: "Variants", meta: { className: "text-right" } },
  {
    accessorKey: "total_stock",
    header: "Stock",
    meta: { className: "text-right" },
    cell: ({ row }) =>
      row.original.total_stock === 0 ? (
        <Badge variant="destructive">Out</Badge>
      ) : (
        row.original.total_stock
      ),
  },
  {
    accessorKey: "is_published",
    header: "Status",
    cell: ({ row }) => (
      <span className="flex flex-wrap gap-1">
        {row.original.is_published ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="outline">Draft</Badge>
        )}
        {row.original.on_sale ? <Badge variant="info">On sale</Badge> : null}
      </span>
    ),
  },
  {
    id: "actions",
    meta: { className: "w-12 text-right" },
    cell: ({ row }) => <ProductRowActions product={row.original} />,
  },
];

export function ProductsTable({
  products,
  filtered,
}: {
  products: ProductListItem[];
  filtered: boolean;
}) {
  return (
    <DataTable
      columns={COLUMNS}
      data={products}
      getRowId={(product) => product.id}
      empty={
        <TableEmpty
          icon={PackageSearchIcon}
          title={filtered ? "No products match these filters" : "No products yet"}
          description={
            filtered
              ? "Clear a filter or search for something shorter."
              : "Create the first product to start selling."
          }
        />
      }
    />
  );
}
