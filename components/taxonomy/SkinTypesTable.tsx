"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/data-table/DataTable";
import { slugColumn, sortOrderColumn, usageColumn } from "@/components/taxonomy/columns";
import { RowActions } from "@/components/taxonomy/RowActions";
import { SkinTypeDialog } from "@/components/taxonomy/SkinTypeDialog";
import { TaxonomyEmpty } from "@/components/taxonomy/TaxonomyEmpty";
import type { SkinType } from "@/lib/api/types";

function detachWarning({ product_count }: SkinType): string {
  const products = product_count === 1 ? "1 product" : `${product_count} products`;
  return product_count > 0
    ? `It will be removed from the ${products} that list it. This cannot be undone.`
    : "This cannot be undone.";
}

const COLUMNS: ColumnDef<SkinType>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  slugColumn<SkinType>(),
  sortOrderColumn<SkinType>(),
  usageColumn<SkinType>("product_count"),
  {
    id: "actions",
    meta: { className: "w-12 text-right" },
    cell: ({ row }) => (
      <RowActions
        kind="skin-types"
        id={row.original.id}
        name={row.original.name}
        deleteDescription={detachWarning(row.original)}
        editDialog={(state) => <SkinTypeDialog skinType={row.original} {...state} />}
      />
    ),
  },
];

export function SkinTypesTable({ skinTypes, query }: { skinTypes: SkinType[]; query: string }) {
  return (
    <DataTable
      columns={COLUMNS}
      data={skinTypes}
      getRowId={(skinType) => skinType.id}
      empty={<TaxonomyEmpty noun="skin types" query={query} />}
    />
  );
}
