import type { ColumnDef } from "@tanstack/react-table";

type TaxonomyRow = { slug: string; sort_order: number };

export function slugColumn<T extends TaxonomyRow>(): ColumnDef<T> {
  return {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-xs">{row.original.slug}</span>
    ),
  };
}

export function sortOrderColumn<T extends TaxonomyRow>(): ColumnDef<T> {
  return { accessorKey: "sort_order", header: "Order", meta: { className: "w-20 text-right" } };
}

export function usageColumn<T extends TaxonomyRow>(
  key: "product_count" | "variant_count",
): ColumnDef<T> {
  return {
    accessorKey: key,
    header: key === "product_count" ? "Products" : "Variants",
    meta: { className: "w-24 text-right" },
  };
}
