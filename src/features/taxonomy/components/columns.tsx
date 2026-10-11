import type { ColumnDef } from "@tanstack/react-table";

interface TaxonomyRow {
  slug: string;
  sort_order: number;
}

export function slugColumn<T extends TaxonomyRow>(): ColumnDef<T> {
  return {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">{row.original.slug}</span>
    ),
  };
}

export function sortOrderColumn<T extends TaxonomyRow>(): ColumnDef<T> {
  return {
    accessorKey: "sort_order",
    header: () => <div className="text-right">Order</div>,
    cell: ({ row }) => <div className="text-right">{row.original.sort_order}</div>,
  };
}

export function usageColumn<T extends TaxonomyRow & Record<K, number>, K extends string>(
  key: K,
  header: string,
): ColumnDef<T> {
  return {
    id: key,
    header: () => <div className="text-right">{header}</div>,
    cell: ({ row }) => <div className="text-right">{row.original[key]}</div>,
  };
}
