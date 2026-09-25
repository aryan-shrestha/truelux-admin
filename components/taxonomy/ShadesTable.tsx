"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/DataTable";
import { RowActions } from "@/components/taxonomy/RowActions";
import { ShadeDialog } from "@/components/taxonomy/ShadeDialog";
import { ShadeSwatch } from "@/components/taxonomy/ShadeSwatch";
import { TaxonomyEmpty } from "@/components/taxonomy/TaxonomyEmpty";
import type { Shade } from "@/lib/api/types";

const COLUMNS: ColumnDef<Shade>[] = [
  {
    accessorKey: "name",
    header: "Shade",
    cell: ({ row }) => <ShadeSwatch name={row.original.name} hex={row.original.hex_code} />,
  },
  {
    accessorKey: "hex_code",
    header: "Hex",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.hex_code}</span>,
  },
  {
    accessorKey: "slug",
    header: "Slug",
    cell: ({ row }) => (
      <span className="text-muted-foreground font-mono text-xs">{row.original.slug}</span>
    ),
  },
  { accessorKey: "sort_order", header: "Order", meta: { className: "w-20 text-right" } },
  { accessorKey: "variant_count", header: "Variants", meta: { className: "w-24 text-right" } },
  {
    id: "actions",
    meta: { className: "w-12 text-right" },
    cell: ({ row }) => (
      <RowActions
        kind="shades"
        id={row.original.id}
        name={row.original.name}
        inUseMessage={`In use by ${row.original.variant_count} variants. Reassign them first.`}
        editDialog={(state) => <ShadeDialog shade={row.original} {...state} />}
      />
    ),
  },
];

export function ShadesTable({ shades, query }: { shades: Shade[]; query: string }) {
  return (
    <DataTable
      columns={COLUMNS}
      data={shades}
      getRowId={(shade) => shade.id}
      empty={<TaxonomyEmpty noun="shades" query={query} />}
    />
  );
}
