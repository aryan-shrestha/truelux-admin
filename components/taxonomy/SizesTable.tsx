"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/DataTable";
import { slugColumn, sortOrderColumn, usageColumn } from "@/components/taxonomy/columns";
import { RowActions } from "@/components/taxonomy/RowActions";
import { SizeDialog } from "@/components/taxonomy/SizeDialog";
import { TaxonomyEmpty } from "@/components/taxonomy/TaxonomyEmpty";
import type { Size } from "@/lib/api/types";

const COLUMNS: ColumnDef<Size>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  slugColumn<Size>(),
  sortOrderColumn<Size>(),
  usageColumn<Size>("variant_count"),
  {
    id: "actions",
    meta: { className: "w-12 text-right" },
    cell: ({ row }) => (
      <RowActions
        kind="sizes"
        id={row.original.id}
        name={row.original.name}
        inUseMessage={`In use by ${row.original.variant_count} variants. Reassign them first.`}
        editDialog={(state) => <SizeDialog size={row.original} {...state} />}
      />
    ),
  },
];

export function SizesTable({ sizes, query }: { sizes: Size[]; query: string }) {
  return (
    <DataTable
      columns={COLUMNS}
      data={sizes}
      getRowId={(size) => size.id}
      empty={<TaxonomyEmpty noun="sizes" query={query} />}
    />
  );
}
