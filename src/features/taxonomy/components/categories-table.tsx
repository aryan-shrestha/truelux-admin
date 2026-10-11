import type { ColumnDef } from "@tanstack/react-table";
import { CornerDownRightIcon } from "lucide-react";

import { DataTable } from "@/components/data-table/data-table";

import { toCategoryRows, type CategoryRow } from "../category-tree";
import { useTaxonomySearch } from "../use-taxonomy-search";
import { CategoryDialog } from "./category-dialog";
import { slugColumn, sortOrderColumn, usageColumn } from "./columns";
import { RowActions } from "./row-actions";
import { TaxonomyEmpty } from "./taxonomy-empty";

const COLUMNS: ColumnDef<CategoryRow>[] = [
  {
    accessorKey: "name",
    header: "Category",
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
    cell: ({ row }) =>
      row.original.parentName ?? <span className="text-muted-foreground">Top level</span>,
  },
  slugColumn<CategoryRow>(),
  sortOrderColumn<CategoryRow>(),
  usageColumn<CategoryRow, "product_count">("product_count", "Products"),
  {
    id: "actions",
    cell: ({ row }) => (
      <div className="text-right">
        <RowActions
          kind="categories"
          id={row.original.id}
          name={row.original.name}
          inUseMessage={`In use by ${row.original.product_count} products. Reassign them first.`}
          editDialog={(state) => <CategoryDialog category={row.original} {...state} />}
        />
      </div>
    ),
  },
];

export function CategoriesTable({ query }: { query: string | undefined }) {
  const categories = useTaxonomySearch("categories", query);
  return (
    <DataTable
      columns={COLUMNS}
      data={toCategoryRows(categories)}
      empty={<TaxonomyEmpty noun="categories" query={query} />}
    />
  );
}
