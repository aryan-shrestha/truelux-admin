import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { ImageIcon, PackageIcon } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/money";

import type { ProductListItem } from "../schemas/product.schema";
import { ProductRowActions } from "./product-row-actions";

const COLUMNS: ColumnDef<ProductListItem>[] = [
  {
    id: "image",
    header: () => <span className="sr-only">Image</span>,
    cell: ({ row }) =>
      row.original.primary_image_url ? (
        <img
          src={row.original.primary_image_url}
          alt=""
          className="size-10 rounded-md border object-cover"
        />
      ) : (
        <span className="flex size-10 items-center justify-center rounded-md border bg-muted">
          <ImageIcon aria-hidden className="size-4 text-muted-foreground" />
        </span>
      ),
  },
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <div className="min-w-0">
        <Link
          to="/products/$productId"
          params={{ productId: row.original.id }}
          className="font-medium hover:underline"
        >
          {row.original.name}
        </Link>
        <div className="font-mono text-xs text-muted-foreground">{row.original.slug}</div>
      </div>
    ),
  },
  { id: "brand", header: "Brand", cell: ({ row }) => row.original.brand.name },
  { id: "category", header: "Category", cell: ({ row }) => row.original.category.name },
  {
    accessorKey: "base_price",
    header: () => <div className="text-right">Price</div>,
    cell: ({ row }) => <div className="text-right">{formatMoney(row.original.base_price)}</div>,
  },
  {
    accessorKey: "variant_count",
    header: () => <div className="text-right">Variants</div>,
    cell: ({ row }) => <div className="text-right">{row.original.variant_count}</div>,
  },
  {
    accessorKey: "total_stock",
    header: () => <div className="text-right">Stock</div>,
    cell: ({ row }) => (
      <div className="text-right">
        {row.original.total_stock === 0 ? (
          <Badge variant="destructive">Out</Badge>
        ) : (
          row.original.total_stock
        )}
      </div>
    ),
  },
  {
    accessorKey: "is_published",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.is_published ? (
          <Badge variant="success">Published</Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        )}
        {row.original.on_sale && <Badge variant="info">On sale</Badge>}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <ProductRowActions product={row.original} />
      </div>
    ),
  },
];

export function ProductsTable({
  products,
  count,
  pageIndex,
  pageSize,
  isFiltered,
  isLoading,
  isPlaceholderData,
}: {
  products: ProductListItem[];
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
      data={products}
      pagination={{ pageIndex, pageSize, rowCount: count }}
      isLoading={isLoading}
      isPlaceholderData={isPlaceholderData}
      empty={
        <EmptyState
          icon={PackageIcon}
          title={isFiltered ? "No products match these filters" : "No products yet"}
          description={
            isFiltered ? "Clear a filter or search for something else." : "Create the first one."
          }
        />
      }
    />
  );
}
