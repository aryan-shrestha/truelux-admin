"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CornerDownRightIcon } from "lucide-react";

import { DataTable } from "@/components/data-table/DataTable";
import { slugColumn, sortOrderColumn, usageColumn } from "@/components/taxonomy/columns";
import { CategoryDialog } from "@/components/taxonomy/CategoryDialog";
import { RowActions } from "@/components/taxonomy/RowActions";
import { TaxonomyEmpty } from "@/components/taxonomy/TaxonomyEmpty";
import { useTaxonomySearch } from "@/components/taxonomy/use-taxonomy-search";
import { type CategoryRow, toCategoryRows } from "@/lib/taxonomy/category-tree";

const COLUMNS: ColumnDef<CategoryRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) =>
      row.original.depth === 1 ? (
        <span className="flex items-center gap-2 pl-4">
          <CornerDownRightIcon aria-hidden className="text-muted-foreground size-3.5" />
          {row.original.name}
        </span>
      ) : (
        <span className="font-medium">{row.original.name}</span>
      ),
  },
  {
    accessorKey: "parentName",
    header: "Parent",
    cell: ({ row }) =>
      row.original.parentName ?? <span className="text-muted-foreground">Top level</span>,
  },
  slugColumn<CategoryRow>(),
  sortOrderColumn<CategoryRow>(),
  usageColumn<CategoryRow>("product_count"),
  {
    id: "actions",
    meta: { className: "w-12 text-right" },
    cell: ({ row }) => (
      <RowActions
        kind="categories"
        id={row.original.id}
        name={row.original.name}
        inUseMessage={`In use by ${row.original.product_count} products. Reassign them first.`}
        editDialog={(state) => <CategoryDialog category={row.original} {...state} />}
      />
    ),
  },
];

export function CategoriesTable() {
  const { items, query } = useTaxonomySearch("categories");
  return (
    <DataTable
      columns={COLUMNS}
      data={toCategoryRows(items)}
      getRowId={(category) => category.id}
      empty={<TaxonomyEmpty noun="categories" query={query} />}
    />
  );
}
