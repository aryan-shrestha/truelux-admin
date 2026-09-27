"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/DataTable";
import { slugColumn, sortOrderColumn, usageColumn } from "@/components/taxonomy/columns";
import { RowActions } from "@/components/taxonomy/RowActions";
import { ShadeDialog } from "@/components/taxonomy/ShadeDialog";
import { ShadeSwatch } from "@/components/taxonomy/ShadeSwatch";
import { TaxonomyEmpty } from "@/components/taxonomy/TaxonomyEmpty";
import { useTaxonomySearch } from "@/components/taxonomy/use-taxonomy-search";
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
  slugColumn<Shade>(),
  sortOrderColumn<Shade>(),
  usageColumn<Shade>("variant_count"),
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

export function ShadesTable() {
  const { items: shades, query } = useTaxonomySearch("shades");
  return (
    <DataTable
      columns={COLUMNS}
      data={shades}
      getRowId={(shade) => shade.id}
      empty={<TaxonomyEmpty noun="shades" query={query} />}
    />
  );
}
