"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CornerDownRightIcon } from "lucide-react";

import { DataTable } from "@/components/data-table/DataTable";
import type { SelectOption } from "@/components/form/SelectField";
import { CategoryDialog } from "@/components/taxonomy/CategoryDialog";
import { RowActions } from "@/components/taxonomy/RowActions";
import { TaxonomyEmpty } from "@/components/taxonomy/TaxonomyEmpty";
import type { CategoryRow } from "@/lib/taxonomy/category-tree";

function columns(roots: SelectOption[]): ColumnDef<CategoryRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) =>
        row.original.depth === 1 ? (
          <span className="flex items-center gap-2 pl-4">
            <CornerDownRightIcon aria-hidden className="size-3.5 text-muted-foreground" />
            {row.original.name}
          </span>
        ) : (
          <span className="font-medium">{row.original.name}</span>
        ),
    },
    {
      accessorKey: "parentName",
      header: "Parent",
      cell: ({ row }) => row.original.parentName ?? <span className="text-muted-foreground">Top level</span>,
    },
    { accessorKey: "slug", header: "Slug", cell: ({ row }) => <span className="font-mono text-xs text-muted-foreground">{row.original.slug}</span> },
    { accessorKey: "sort_order", header: "Order", meta: { className: "w-20 text-right" } },
    { accessorKey: "product_count", header: "Products", meta: { className: "w-24 text-right" } },
    {
      id: "actions",
      meta: { className: "w-12 text-right" },
      cell: ({ row }) => (
        <RowActions
          kind="categories"
          id={row.original.id}
          name={row.original.name}
          inUseMessage={`In use by ${row.original.product_count} products. Reassign them first.`}
          editDialog={(state) => <CategoryDialog category={row.original} roots={roots} {...state} />}
        />
      ),
    },
  ];
}

type CategoriesTableProps = {
  rows: CategoryRow[];
  roots: SelectOption[];
  query: string;
};

export function CategoriesTable({ rows, roots, query }: CategoriesTableProps) {
  return (
    <DataTable
      columns={columns(roots)}
      data={rows}
      getRowId={(category) => category.id}
      empty={<TaxonomyEmpty noun="categories" query={query} />}
    />
  );
}
